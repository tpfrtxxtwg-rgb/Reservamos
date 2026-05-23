import { z } from "zod";
import { createRouter, clientAuthedQuery } from "./middleware";
import { getRawDb } from "./queries/connection";

export const paymentSettingsRouter = createRouter({
  get: clientAuthedQuery.query(async ({ ctx }) => {
    const clientId = ctx.clientUser.clientId;
    const rawDb = getRawDb();
    try {
      const [rows] = await rawDb.execute(
        `SELECT test_mode, stripe_enabled, stripe_secret_key, stripe_publishable_key,
          paypal_enabled, paypal_client_id, paypal_client_secret,
          accepted_methods
         FROM client_payment_settings WHERE clientId = ? LIMIT 1`,
        [clientId]
      );
      const result = (rows as any[])[0];
      if (result) {
        return {
          testMode: result.test_mode ?? true,
          stripeEnabled: result.stripe_enabled ?? false,
          stripeSecretKey: result.stripe_secret_key ?? "",
          stripePublishableKey: result.stripe_publishable_key ?? "",
          paypalEnabled: result.paypal_enabled ?? false,
          paypalClientId: result.paypal_client_id ?? "",
          paypalClientSecret: result.paypal_client_secret ?? "",
          acceptedMethods: result.accepted_methods ?? "cash",
        };
      }
    } catch (err: any) {
      console.error("[PaymentSettings] GET error:", err?.message || String(err));
    }
    return {
      testMode: true,
      stripeEnabled: false,
      stripeSecretKey: "",
      stripePublishableKey: "",
      paypalEnabled: false,
      paypalClientId: "",
      paypalClientSecret: "",
      acceptedMethods: "cash",
    };
  }),

  update: clientAuthedQuery
    .input(
      z.object({
        testMode: z.boolean().optional(),
        stripeEnabled: z.boolean().optional(),
        stripeSecretKey: z.string().max(255).nullable().optional(),
        stripePublishableKey: z.string().max(255).nullable().optional(),
        paypalEnabled: z.boolean().optional(),
        paypalClientId: z.string().max(255).nullable().optional(),
        paypalClientSecret: z.string().max(255).nullable().optional(),
        acceptedMethods: z.enum(["card", "paypal", "cash", "card_paypal", "all"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const clientId = ctx.clientUser.clientId;
      const rawDb = getRawDb();

      try {
        const [existingRows] = await rawDb.execute(
          "SELECT id FROM client_payment_settings WHERE clientId = ? LIMIT 1",
          [clientId]
        );

        if ((existingRows as any[]).length === 0) {
          await rawDb.execute(
            `INSERT INTO client_payment_settings
             (clientId, test_mode, stripe_enabled, stripe_secret_key, stripe_publishable_key,
              paypal_enabled, paypal_client_id, paypal_client_secret, accepted_methods)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [clientId,
             input.testMode ?? true,
             input.stripeEnabled ?? false,
             input.stripeSecretKey ?? "",
             input.stripePublishableKey ?? "",
             input.paypalEnabled ?? false,
             input.paypalClientId ?? "",
             input.paypalClientSecret ?? "",
             input.acceptedMethods ?? "cash"]
          );
        } else {
          const sets: string[] = [];
          const values: any[] = [];

          if (input.testMode !== undefined) { sets.push("test_mode = ?"); values.push(input.testMode); }
          if (input.stripeEnabled !== undefined) { sets.push("stripe_enabled = ?"); values.push(input.stripeEnabled); }
          if (input.stripeSecretKey !== undefined) { sets.push("stripe_secret_key = ?"); values.push(input.stripeSecretKey); }
          if (input.stripePublishableKey !== undefined) { sets.push("stripe_publishable_key = ?"); values.push(input.stripePublishableKey); }
          if (input.paypalEnabled !== undefined) { sets.push("paypal_enabled = ?"); values.push(input.paypalEnabled); }
          if (input.paypalClientId !== undefined) { sets.push("paypal_client_id = ?"); values.push(input.paypalClientId); }
          if (input.paypalClientSecret !== undefined) { sets.push("paypal_client_secret = ?"); values.push(input.paypalClientSecret); }
          if (input.acceptedMethods !== undefined) { sets.push("accepted_methods = ?"); values.push(input.acceptedMethods); }

          if (sets.length === 0) return { success: true };

          values.push(clientId);
          await rawDb.execute(
            `UPDATE client_payment_settings SET ${sets.join(", ")} WHERE clientId = ?`,
            values
          );
        }

        return { success: true };
      } catch (err: any) {
        console.error("[PaymentSettings] UPDATE error:", err?.message || String(err));
        throw new Error("Failed to save payment settings: " + (err?.message || String(err)));
      }
    }),

  testPayment: clientAuthedQuery
    .input(z.object({ provider: z.enum(["stripe", "paypal"]) }))
    .mutation(async ({ input, ctx }) => {
      const clientId = ctx.clientUser.clientId;
      const rawDb = getRawDb();

      try {
        const [rows] = await rawDb.execute(
          `SELECT test_mode, stripe_enabled, stripe_secret_key,
            paypal_enabled, paypal_client_id
           FROM client_payment_settings WHERE clientId = ? LIMIT 1`,
          [clientId]
        );
        const result = (rows as any[])[0];
        if (!result) {
          return { success: false, reason: "Payment settings not configured" };
        }

        if (result.test_mode) {
          return {
            success: true,
            reason: `${input.provider.toUpperCase()} test mode active — no real charge`,
            testMode: true,
          };
        }

        if (input.provider === "stripe" && result.stripe_enabled && result.stripe_secret_key) {
          return { success: true, reason: "Stripe configured for live payments", testMode: false };
        }
        if (input.provider === "paypal" && result.paypal_enabled && result.paypal_client_id) {
          return { success: true, reason: "PayPal configured for live payments", testMode: false };
        }

        return { success: false, reason: `${input.provider} not fully configured` };
      } catch (err: any) {
        return { success: false, reason: "Error: " + (err?.message || String(err)) };
      }
    }),
});
