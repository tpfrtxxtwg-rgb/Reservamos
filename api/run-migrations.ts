/**
 * SQL Migration Runner
 * Executes pending .sql migration files in order against the raw MySQL pool.
 * Tracks executed migrations in a `migrations` table.
 */
import fs from "fs";
import path from "path";
import { getRawDb } from "./queries/connection";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "db/migrations");
const MIGRATIONS_TABLE = "migrations";

export async function runMigrations() {
  const db = getRawDb();

  // Ensure migrations tracking table exists
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);

  // Get already executed migrations
  const [executedRows] = await db.execute(
    `SELECT filename FROM ${MIGRATIONS_TABLE} ORDER BY id`
  );
  const executed = new Set((executedRows as any[]).map((r) => r.filename));

  // Find all .sql files in migrations directory, sorted
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (executed.has(file)) {
      console.log(`[migration] Skipping (already executed): ${file}`);
      continue;
    }

    const filepath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filepath, "utf-8");

    console.log(`[migration] Running: ${file} ...`);
    try {
      // Split by semicolons and execute each statement
      const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--") && !s.startsWith("/*"));

      for (const stmt of statements) {
        // Skip conditional logic blocks that TiDB may not support in prepared statements
        if (
          stmt.toUpperCase().startsWith("SET ") ||
          stmt.toUpperCase().startsWith("SELECT ") ||
          stmt.toUpperCase().startsWith("PREPARE ") ||
          stmt.toUpperCase().startsWith("EXECUTE ") ||
          stmt.toUpperCase().startsWith("DEALLOCATE ")
        ) {
          try {
            await db.execute(stmt);
          } catch (e: any) {
            // SET/SELECT statements are safe to ignore if they fail
            if (!e.message?.includes("Unknown column")) {
              console.log(`[migration] Note: ${stmt.substring(0, 50)}... (${e.message})`);
            }
          }
          continue;
        }

        try {
          await db.execute(stmt + ";");
        } catch (e: any) {
          // Ignore "already exists" errors
          if (
            e.message?.includes("Duplicate") ||
            e.message?.includes("already exists")
          ) {
            console.log(`[migration] Note: skipping duplicate (${e.message})`);
          } else {
            throw e;
          }
        }
      }

      // Mark as executed
      await db.execute(`INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES (?)`, [file]);
      console.log(`[migration] Completed: ${file}`);
    } catch (e: any) {
      console.error(`[migration] FAILED: ${file} — ${e.message}`);
      // Don't throw — let the app start even if a migration fails
      // This prevents the app from being completely down due to a migration issue
    }
  }

  console.log(`[migration] All migrations checked. ${files.length} total, ${executed.size} were already executed.`);
}
