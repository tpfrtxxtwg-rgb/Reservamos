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
        // MySQL BOOLEAN returns 0/1 numbers, convert to true boolean
        const toBool = (v: any) => v === 1 || v === true || v === "1";
        return {
          testMode: toBool(result.test_mode),
          stripeEnabled: toBool(result.stripe_enabled),
          stripeSecretKey: result.stripe_secret_key ?? "",
          stripePublishableKey: result.stripe_publishable_key ?? "",
          paypalEnabled: toBool(result.paypal_enabled),
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
        testMode: z.union([z.boolean(), z.number()]).optional().transform(v => v === 1 || v === true || v === "1"),
        stripeEnabled: z.union([z.boolean(), z.number()]).optional().transform(v => v === 1 || v === true || v === "1"),
        stripeSecretKey: z.string().max(255).nullable().optional(),
        stripePublishableKey: z.string().max(255).nullable().optional(),
        paypalEnabled: z.union([z.boolean(), z.number()]).optional().transform(v => v === 1 || v === true || v === "1"),
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
          console.log("[PaymentSettings] INSERT new record clientId=", clientId);
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
          console.log("[PaymentSettings] INSERT success clientId=", clientId);
        } else {
          const sets: string[] = [];
          const values: any[] = [];
          console.log("[PaymentSettings] UPDATE existing record clientId=", clientId);

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
        const errMsg = err?.message || String(err);
        console.error("[PaymentSettings] UPDATE error:", errMsg);
        // Check if column doesn't exist
        if (errMsg.includes("Unknown column") || errMsg.includes("doesn't have a column") || errMsg.includes("field list")) {
          console.error("[PaymentSettings] Column missing error - table may need migration");
        }
        console.error("[PaymentSettings] Input was:", JSON.stringify({
          paypalEnabled: input.paypalEnabled,
          paypalClientId: input.paypalClientId ? 'SET' : 'NOT_SET',
          paypalClientSecret: input.paypalClientSecret ? 'SET' : 'NOT_SET',
          testMode: input.testMode,
        }));
        throw new Error("Failed to save: " + errMsg);
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
