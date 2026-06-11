import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import path from "path";

type App = Hono<{ Bindings: HttpBindings }>;

export function serveStaticFiles(app: App) {
  const distPath = path.resolve(process.cwd(), "dist/public");

  // Log for debugging what files are available
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
    const idx = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
    console.log("[serveStatic] index.html loaded, size:", idx.length);
  }

  app.use("/assets/*", serveStatic({
    root: "./dist/public",
    onFound: (_path, c) => {
      c.header("Cache-Control", "no-cache, no-store, must-revalidate");
    },
  }));

  // Serve i18n translation files
  app.use("/i18n/*", serveStatic({
    root: "./dist/public",
    onFound: (_path, c) => {
      c.header("Content-Type", "application/json; charset=utf-8");
      c.header("Cache-Control", "no-cache, no-store, must-revalidate");
    },
  }));

  app.notFound((c) => {
    const accept = c.req.header("accept") ?? "";
    if (!accept.includes("text/html")) {
      return c.json({ error: "Not Found" }, 404);
    }
    const indexPath = path.resolve(distPath, "index.html");
    const content = fs.readFileSync(indexPath, "utf-8");
    c.header("Cache-Control", "no-cache, no-store, must-revalidate");
    c.header("Pragma", "no-cache");
    c.header("Expires", "0");
    return c.html(content);
  });
}