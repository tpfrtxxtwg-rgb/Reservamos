import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";

const app = new Hono<{ Bindings: HttpBindings }>();

// Health check endpoint to verify deployment version
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    version: "v5",
    lang: "en",
    timestamp: new Date().toISOString(),
    features: ["5-step-booking", "origin-field", "hotel-autocomplete", "luggage", "optional-services", "deposit-payment", "iva-16"],
  });
});

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

// Auto-migration: depositPercentage → depositFixedAmount (non-interactive)
async function runMigrations() {
  try {
    const { getDb } = await import("./queries/connection");
    const db = getDb();
    console.log("[migrate] Checking deposit columns...");
    const result = await db.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'clients' AND COLUMN_NAME = 'depositFixedAmount'`
    );
    const hasColumn = Array.isArray(result) && result.length > 0;
    if (!hasColumn) {
      console.log("[migrate] Adding depositFixedAmount column...");
      await db.execute(
        `ALTER TABLE clients ADD COLUMN depositFixedAmount DECIMAL(10,2) NOT NULL DEFAULT '50.00'`
      );
      await db.execute(
        `UPDATE clients SET depositFixedAmount = depositPercentage WHERE depositPercentage IS NOT NULL`
      );
      console.log("[migrate] Column created and data copied ✓");
    } else {
      console.log("[migrate] Column already exists ✓");
    }
  } catch (err: any) {
    console.error("[migrate] Error:", err.message);
  }
}

if (env.isProduction) {
  await runMigrations();
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
