import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
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
    version: "v6",
    lang: "en",
    timestamp: new Date().toISOString(),
    features: ["5-step-booking", "origin-field", "hotel-autocomplete", "luggage", "optional-services", "deposit-payment", "iva-16", "embed-widget"],
  });
});

// CORS: allow widget embedding from any origin
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
}));

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

/**
 * Widget Embed Script - Option 1: Script Tag
 * Returns a dynamic JS script that injects the booking widget
 * into the host page's #reservamos-widget container.
 *
 * Usage: <script src="https://yoursite.com/widget/embed.js?key=API_KEY"></script>
 *        <div id="reservamos-widget"></div>
 */
app.get("/widget/embed.js", async (c) => {
  const url = new URL(c.req.url);
  const apiKey = url.searchParams.get("key") || url.searchParams.get("apiKey") || "";
  const origin = url.origin;

  if (!apiKey) {
    c.header("Content-Type", "application/javascript");
    return c.body(`console.error("[ReserVamos] Missing API key. Use ?key=YOUR_API_KEY");`);
  }

  const script = `
/**
 * ReserVamos Booking Widget Embed Script
 * Auto-generated - Do not modify
 */
(function() {
  "use strict";

  var CONTAINER_ID = "reservamos-widget";
  var config = {
    apiKey: ${JSON.stringify(apiKey)},
    origin: ${JSON.stringify(origin)},
    containerId: CONTAINER_ID
  };

  // Find or create container
  var container = document.getElementById(config.containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = config.containerId;
    document.body.appendChild(container);
  }

  // Create iframe for isolated widget
  var iframe = document.createElement("iframe");
  iframe.src = config.origin + "/widget/embed?key=" + encodeURIComponent(config.apiKey);
  iframe.width = "100%";
  iframe.height = "700";
  iframe.frameBorder = "0";
  iframe.style.cssText = "border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;";
  iframe.title = "ReserVamos Booking Widget";
  iframe.allow = "payment *";

  // Auto-resize iframe based on widget content
  window.addEventListener("message", function(event) {
    if (event.data && event.data.type === "reservamos-resize" && event.data.height) {
      iframe.height = Math.max(600, event.data.height + 40) + "px";
    }
  });

  // Clear container and append iframe
  container.innerHTML = "";
  container.appendChild(iframe);

  // Log successful initialization
  console.log("[ReserVamos] Widget loaded for API key:", config.apiKey.substring(0, 8) + "...");
})();
`;

  c.header("Content-Type", "application/javascript; charset=utf-8");
  c.header("Cache-Control", "no-cache, no-store, must-revalidate");
  return c.body(script);
});

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

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
