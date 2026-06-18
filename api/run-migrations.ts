/**
 * SQL Migration Runner
 * Executes pending .sql migration files in order against the raw MySQL pool.
 * Tracks executed migrations in a `migrations` table.
 * Robust: skips files with syntax errors, logs everything.
 */
import fs from "fs";
import path from "path";
import { getRawDb } from "./queries/connection";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "db/migrations");
const MIGRATIONS_TABLE = "migrations";

export async function runMigrations() {
  const db = getRawDb();

  try {
    // Ensure migrations tracking table exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
  } catch (e: any) {
    console.error("[migration] Could not create migrations table:", e.message);
    return;
  }

  // Get already executed migrations
  let executed: Set<string>;
  try {
    const [executedRows] = await db.execute(
      `SELECT filename FROM ${MIGRATIONS_TABLE} ORDER BY id`
    );
    executed = new Set((executedRows as any[]).map((r) => r.filename));
  } catch (e: any) {
    console.error("[migration] Could not read executed migrations:", e.message);
    return;
  }

  // Find all .sql files in migrations directory, sorted
  let files: string[];
  try {
    files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();
  } catch (e: any) {
    console.error("[migration] Could not read migrations directory:", e.message);
    return;
  }

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const file of files) {
    if (executed.has(file)) {
      skipCount++;
      continue;
    }

    const filepath = path.join(MIGRATIONS_DIR, file);
    let sql: string;
    try {
      sql = fs.readFileSync(filepath, "utf-8");
    } catch (e: any) {
      console.error(`[migration] FAILED to read ${file}:`, e.message);
      failCount++;
      continue;
    }

    // Quick sanity check: reject files with git conflict markers
    if (sql.includes("<<<<<<<") || sql.includes("=======") || sql.includes(">>>>>>>")) {
      console.error(`[migration] SKIPPED ${file}: contains git conflict markers`);
      // Mark as executed so we don't retry the broken file
      try {
        await db.execute(`INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES (?)`, [file]);
      } catch { /* ignore */ }
      failCount++;
      continue;
    }

    console.log(`[migration] Running: ${file} ...`);
    try {
      // Execute the whole SQL file as a single statement
      await db.execute(sql);

      // Mark as executed
      await db.execute(`INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES (?)`, [file]);
      console.log(`[migration] Completed: ${file}`);
      successCount++;
    } catch (e: any) {
      // If it fails because tables already exist, that's fine for CREATE TABLE IF NOT EXISTS
      if (e.message?.includes("already exists") || e.message?.includes("Duplicate")) {
        console.log(`[migration] Note: ${file} skipped (already exists)`);
        try {
          await db.execute(`INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES (?)`, [file]);
        } catch { /* ignore */ }
        successCount++;
      } else {
        console.error(`[migration] FAILED: ${file} — ${e.message}`);
        // Mark as executed to prevent infinite retry loops
        try {
          await db.execute(`INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES (?)`, [file]);
        } catch { /* ignore */ }
        failCount++;
      }
    }
  }

  console.log(`[migration] Done. ${successCount} ran, ${skipCount} skipped, ${failCount} failed. Total files: ${files.length}`);
}
