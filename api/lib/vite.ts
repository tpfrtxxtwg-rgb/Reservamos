import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import path from "path";

type App = Hono<{ Bindings: HttpBindings }>;

export function serveStaticFiles(app: App) {
  const distPath = path.resolve(process.cwd(), "dist/public");
  const indexPath = path.join(distPath, "index.html");

  // Debug logging
  console.log("[serveStatic] cwd:", process.cwd());
  console.log("[serveStatic] distPath:", distPath);
  console.log("[serveStatic] dist exists:", fs.existsSync(distPath));

  if (fs.existsSync(distPath)) {
    try {
      const files = fs.readdirSync(distPath);
      console.log("[serveStatic] dist files:", files);
      console.log("[serveStatic] index.html exists:", fs.existsSync(indexPath));
    } catch (e: any) {
      console.log("[serveStatic] error reading dist:", e.message);
    }
  }

  // Serve assets with correct MIME types and no cache
  app.use("/assets/*", serveStatic({
    root: "./dist/public",
    onFound: (_path, c) => {
      c.header("Cache-Control", "no-cache, no-store, must-revalidate");
    },
  }));

  // Serve index.html for all non-API routes (SPA routing)
  app.get("*", (c) => {
    // Don't interfere with API routes
    const url = new URL(c.req.url);
    if (url.pathname.startsWith("/api/") ||
        url.pathname.startsWith("/health") ||
        url.pathname === "/widget/embed.js") {
      return c.notFound();
    }

    // Serve static files if they exist
    const filePath = path.join(distPath, url.pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath);
      const ext = path.extname(filePath);
      const mimeTypes: Record<string, string> = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
        ".woff2": "font/woff2",
        ".woff": "font/woff",
      };
      c.header("Content-Type", mimeTypes[ext] || "application/octet-stream");
      c.header("Cache-Control", "no-cache, no-store, must-revalidate");
      return c.body(content);
    }

    // For all other routes, serve index.html (SPA routing)
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, "utf-8");
      c.header("Content-Type", "text/html; charset=utf-8");
      c.header("Cache-Control", "no-cache, no-store, must-revalidate");
      return c.body(content);
    }

    return c.json({ error: "index.html not found" }, 500);
  });
}
