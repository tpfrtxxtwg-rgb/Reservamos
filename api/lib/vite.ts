import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import path from "path";

type App = Hono<{ Bindings: HttpBindings }>;

export function serveStaticFiles(app: App) {
  // Try multiple possible paths for dist/public
  const possiblePaths = [
    path.resolve(process.cwd(), "dist/public"),
    path.resolve(import.meta.dirname, "../../public"),
    path.resolve(import.meta.dirname, "../dist/public"),
    path.resolve(import.meta.dirname, "../../../public"),
    "/app/dist/public",
  ];

  let distPath = possiblePaths[0];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      distPath = p;
      break;
    }
  }

  // Log for debugging what files are available
  console.log("[serveStatic] cwd:", process.cwd());
  console.log("[serveStatic] distPath:", distPath);
  console.log("[serveStatic] exists:", fs.existsSync(distPath));
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    console.log("[serveStatic] files in dist/public:", files);
    const assetsPath = path.join(distPath, "assets");
    if (fs.existsSync(assetsPath)) {
      const assets = fs.readdirSync(assetsPath);
      console.log("[serveStatic] assets:", assets.slice(0, 10));
    }
  }

  // Serve static files with absolute path
  app.use("*", serveStatic({
    root: distPath,
    rewriteRequestPath: (p) => {
      // Don't rewrite API routes
      if (p.startsWith("/api/")) return p;
      return p;
    },
  }));

  // SPA fallback: serve index.html for all non-API, non-asset routes
  app.notFound((c) => {
    const url = c.req.url;
    // Don't interfere with API routes
    if (url.includes("/api/")) {
      return c.json({ error: "Not Found" }, 404);
    }

    // Serve index.html for SPA routes
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, "utf-8");
      c.header("Cache-Control", "no-cache, no-store, must-revalidate");
      return c.html(content);
    }

    return c.json({ error: "Not Found" }, 404);
  });
}
