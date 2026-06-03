import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getRawDb } from "./queries/connection";

/**
 * PayPal Router - Handles PayPal order creation and capture
 * Uses PayPal REST API v2
 */

async function getPaypalAccessToken(clientId: string, clientSecret: string, isSandbox: boolean): Promise<string> {
  const baseUrl = isSandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  // Log truncated credentials for debugging (first 8 chars + last 4)
  const cIdPreview = clientId.length > 12 ? `${clientId.slice(0, 8)}...${clientId.slice(-4)}` : `${clientId.slice(0, 4)}***`;
  const cSecPreview = clientSecret.length > 12 ? `${clientSecret.slice(0, 8)}...${clientSecret.slice(-4)}` : `${clientSecret.slice(0, 4)}***`;
  console.log(`[PayPal] getAccessToken: clientId=${cIdPreview}, secret=${cSecPreview}, sandbox=${isSandbox}`);

  // Validate credentials are not empty
  if (!clientId || clientId.trim() === '') {
    throw new Error("PayPal Client ID is empty");
  }
  if (!clientSecret || clientSecret.trim() === '') {
    throw new Error("PayPal Client Secret is empty");
  }

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`[PayPal] auth failed: ${err}`);
    throw new Error(`PayPal auth failed: ${err}`);
  }

  const data = await response.json() as any;
  return data.access_token;
}

export const paypalRouter = createRouter({
  // Get PayPal config for the widget (public endpoint, returns only clientId)
  getConfig: publicQuery
    .input(z.object({ apiKey: z.string().min(1) }))
    .query(async ({ input }) => {
      const rawDb = getRawDb();
      try {
        // Find client by API key
        const [clientRows] = await rawDb.execute(
          "SELECT id, name FROM clients WHERE apiKey = ? AND status = 'active' LIMIT 1",
          [input.apiKey]
        );
        const client = (clientRows as any[])[0];
        if (!client) return { enabled: false, clientId: "", testMode: true };

        // Get payment settings
        const [settingsRows] = await rawDb.execute(
          "SELECT paypal_enabled, paypal_client_id, test_mode FROM client_payment_settings WHERE clientId = ? LIMIT 1",
          [client.id]
        );
        const settings = (settingsRows as any[])[0];
        if (!settings || !settings.paypal_enabled) {
          return { enabled: false, clientId: "", testMode: true };
        }

        return {
          enabled: true,
          clientId: settings.paypal_client_id || "",
          testMode: settings.test_mode ?? true,
        };
      } catch (err: any) {
        console.error("[PayPal] getConfig error:", err?.message);
        return { enabled: false, clientId: "", testMode: true };
      }
    }),

  // Create a PayPal order (called by the widget before showing PayPal button)
  createOrder: publicQuery
    .input(z.object({
      apiKey: z.string().min(1),
      amount: z.string().min(1),
      description: z.string().max(255).optional(),
    }))
    .mutation(async ({ input }) => {
      const rawDb = getRawDb();

      // Get client and payment settings
      const [clientRows] = await rawDb.execute(
        "SELECT id FROM clients WHERE apiKey = ? AND status = 'active' LIMIT 1",
        [input.apiKey]
      );
      const client = (clientRows as any[])[0];
      if (!client) throw new Error("Invalid client");

      const [settingsRows] = await rawDb.execute(
        "SELECT paypal_client_id, paypal_client_secret, test_mode FROM client_payment_settings WHERE clientId = ? LIMIT 1",
        [client.id]
      );
      const settings = (settingsRows as any[])[0];
      console.log(`[PayPal] createOrder: clientId=${client.id}, has_client_id=${!!settings?.paypal_client_id}, has_secret=${!!settings?.paypal_client_secret}`);
      if (!settings?.paypal_client_id || !settings?.paypal_client_secret) {
        throw new Error("PayPal not configured");
      }

      const isSandbox = settings.test_mode ?? true;
      console.log(`[PayPal] createOrder: testMode=${isSandbox}`);
      const accessToken = await getPaypalAccessToken(
        settings.paypal_client_id,
        settings.paypal_client_secret,
        isSandbox
      );

      const baseUrl = isSandbox
        ? "https://api-m.sandbox.paypal.com"
        : "https://api-m.paypal.com";

      const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            amount: {
              currency_code: "USD",
              value: input.amount,
            },
            description: input.description || "ReserVamos Booking",
          }],
          application_context: {
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
          },
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`PayPal order creation failed: ${err}`);
      }

      const orderData = await response.json() as any;
      return { orderId: orderData.id, testMode: isSandbox };
    }),

  // Capture a PayPal order (called after user approves payment)
  captureOrder: publicQuery
    .input(z.object({
      apiKey: z.string().min(1),
      orderId: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const rawDb = getRawDb();

      const [clientRows] = await rawDb.execute(
        "SELECT id FROM clients WHERE apiKey = ? AND status = 'active' LIMIT 1",
        [input.apiKey]
      );
      const client = (clientRows as any[])[0];
      if (!client) throw new Error("Invalid client");

      const [settingsRows] = await rawDb.execute(
        "SELECT paypal_client_id, paypal_client_secret, test_mode FROM client_payment_settings WHERE clientId = ? LIMIT 1",
        [client.id]
      );
      const settings = (settingsRows as any[])[0];
      if (!settings?.paypal_client_id || !settings?.paypal_client_secret) {
        throw new Error("PayPal not configured");
      }

      const isSandbox = settings.test_mode ?? true;
      const accessToken = await getPaypalAccessToken(
        settings.paypal_client_id,
        settings.paypal_client_secret,
        isSandbox
      );

      const baseUrl = isSandbox
        ? "https://api-m.sandbox.paypal.com"
        : "https://api-m.paypal.com";

      const response = await fetch(`${baseUrl}/v2/checkout/orders/${input.orderId}/capture`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`PayPal capture failed: ${err}`);
      }

      const captureData = await response.json() as any;
      const status = captureData.status;
      const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;

      return { status, captureId, testMode: isSandbox };
    }),
});
