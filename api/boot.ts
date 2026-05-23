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
    version: "v6-reports-20250522",
    lang: "en",
    timestamp: new Date().toISOString(),
    features: ["5-step-booking", "origin-field", "hotel-autocomplete", "luggage", "optional-services", "deposit-payment", "iva-16", "reports"],
  });
});

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

// Widget embed.js - generates a script tag that injects the widget into any website
app.get("/widget/embed.js", (c) => {
  const key = c.req.query("key") || c.req.query("apiKey") || "";
  const lng = c.req.query("lng") || "es";
  const origin = new URL(c.req.url).origin;

  const script = `
/* ReserVamos Booking Widget Embed */
(function() {
  var containerId = "reservamos-widget";
  var container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    document.body.appendChild(container);
  }
  var iframe = document.createElement("iframe");
  iframe.src = "${origin}/widget/embed?key=${key}&lng=${lng}";
  iframe.width = "100%";
  iframe.height = "800";
  iframe.frameBorder = "0";
  iframe.style.borderRadius = "12px";
  iframe.style.boxShadow = "0 4px 24px rgba(0,0,0,0.08)";
  iframe.style.border = "none";
  container.appendChild(iframe);
  window.addEventListener("message", function(e) {
    if (e.data && e.data.type === "reservamos-resize") {
      iframe.height = e.data.height + "px";
    }
  });
})();
`;
  c.header("Content-Type", "application/javascript; charset=utf-8");
  c.header("Cache-Control", "no-cache, no-store, must-revalidate");
  c.header("Access-Control-Allow-Origin", "*");
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
