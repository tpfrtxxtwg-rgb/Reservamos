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
 * Usage: <div id="reservamos-widget"></div>
 *        <script src="https://yoursite.com/widget/embed.js?key=API_KEY"></script>
 */
app.get("/widget/embed.js", async (c) => {
  const url = new URL(c.req.url);
  const apiKey = url.searchParams.get("key") || url.searchParams.get("apiKey") || "";
  const lang = url.searchParams.get("lng") || "";
  const origin = url.origin;

  if (!apiKey) {
    c.header("Content-Type", "application/javascript; charset=utf-8");
    c.header("Access-Control-Allow-Origin", "*");
    return c.body(`console.error("[ReserVamos] Missing API key. Use ?key=YOUR_API_KEY");`);
  }

  const script = `
/**
 * ReserVamos Booking Widget Embed Script v2
 * Auto-generated - Do not modify
 */
(function() {
  "use strict";

  function initWidget() {
    var CONTAINER_ID = "reservamos-widget";
    var config = {
      apiKey: ${JSON.stringify(apiKey)},
      origin: ${JSON.stringify(origin)},
      containerId: CONTAINER_ID,
      lang: ${JSON.stringify(lang)}
    };

    // Find or create container
    var container = document.getElementById(config.containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = config.containerId;
      // Append to end of body if container not found
      if (document.body) {
        document.body.appendChild(container);
      } else {
        // Body not ready yet, retry shortly
        setTimeout(initWidget, 100);
        return;
      }
    }

    // Prevent double-init
    if (container.getAttribute("data-reservamos-init") === "1") return;
    container.setAttribute("data-reservamos-init", "1");

    // Create wrapper with loading state
    var wrapper = document.createElement("div");
    wrapper.style.cssText = "position:relative;width:100%;min-height:600px;";

    // Loading indicator
    var loader = document.createElement("div");
    loader.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#FAFAF8;border-radius:12px;z-index:1;transition:opacity 0.3s;";
    loader.innerHTML = '<div style="text-align:center;"><div style="width:40px;height:40px;border:3px solid #E8E4DF;border-top-color:#C75E3A;border-radius:50%;animation:rv-spin 1s linear infinite;margin:0 auto 12px;"></div><p style="font-family:sans-serif;font-size:13px;color:#8A8278;margin:0;">Loading booking widget...</p></div>';

    // Add spinner animation
    if (!document.getElementById("rv-embed-styles")) {
      var style = document.createElement("style");
      style.id = "rv-embed-styles";
      style.textContent = "@keyframes rv-spin{to{transform:rotate(360deg)}}";
      document.head.appendChild(style);
    }

    // Create iframe
    var iframe = document.createElement("iframe");
    var iframeUrl = config.origin + "/widget/embed?key=" + encodeURIComponent(config.apiKey);
    if (config.lang) iframeUrl += "&lng=" + encodeURIComponent(config.lang);
    iframe.src = iframeUrl;
    iframe.width = "100%";
    iframe.height = "700";
    iframe.frameBorder = "0";
    iframe.scrolling = "no";
    iframe.style.cssText = "border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;display:block;";
    iframe.title = "ReserVamos Booking Widget";
    iframe.allow = "payment *";

    // Hide loader when iframe loads
    iframe.onload = function() {
      loader.style.opacity = "0";
      setTimeout(function() { loader.style.display = "none"; }, 300);
    };

    // Auto-resize iframe based on widget content
    window.addEventListener("message", function(event) {
      if (event.data && event.data.type === "reservamos-resize" && event.data.height) {
        var newHeight = Math.max(600, event.data.height + 40);
        iframe.height = newHeight + "px";
        wrapper.style.minHeight = newHeight + "px";
      }
    });

    // Build DOM
    wrapper.appendChild(loader);
    wrapper.appendChild(iframe);
    container.innerHTML = "";
    container.appendChild(wrapper);

    console.log("[ReserVamos] Widget initialized for API key:", config.apiKey.substring(0, 8) + "...");
  }

  // Run when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWidget);
  } else {
    initWidget();
  }
})();
`;

  c.header("Content-Type", "application/javascript; charset=utf-8");
  c.header("Access-Control-Allow-Origin", "*");
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
