import { z } from "zod";
import Stripe from "stripe";
import { createRouter, publicQuery } from "./middleware";
import { getRawDb } from "./queries/connection";

const ANNUAL_PRICE_CENTS = 60000;
const TRIAL_DAYS = 7;

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (!key) throw new Error("Stripe not configured. Set STRIPE_SECRET_KEY env var.");
  return new Stripe(key, { apiVersion: "2025-03-31.basil" });
}

function getWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET || "";
}

export const stripeSubscriptionRouter = createRouter({
  checkConfig: publicQuery.query(() => {
    const pk = process.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || "";
    return {
      configured: !!process.env.STRIPE_SECRET_KEY,
      publishableKey: pk,
    };
  }),

  createSetupIntent: publicQuery
    .input(z.object({ email: z.string().email(), name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const s = getStripe();
      const customer = await s.customers.create({ email: input.email, name: input.name });
      const setupIntent = await s.setupIntents.create({
        customer: customer.id,
        usage: "off_session",
        payment_method_types: ["card"],
      });
      return { customerId: customer.id, clientSecret: setupIntent.client_secret };
    }),

  createSubscription: publicQuery
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(1),
      password: z.string().min(6),
      companyName: z.string().min(1),
      couponCode: z.string().optional(),
      stripeCustomerId: z.string().min(1),
      stripePaymentMethodId: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const s = getStripe();
      const rawDb = getRawDb();

      let discountPercent = 0;
      let couponCode = null;
      if (input.couponCode) {
        const [rows] = await rawDb.execute(
          "SELECT discount_percent, max_uses, uses_count, active FROM coupons WHERE code = ? LIMIT 1",
          [input.couponCode.toUpperCase()]
        );
        const coupon = (rows as any[])[0];
        if (coupon && coupon.active && coupon.uses_count < coupon.max_uses) {
          discountPercent = coupon.discount_percent;
          couponCode = input.couponCode.toUpperCase();
        }
      }

      const finalAmountCents = Math.round(ANNUAL_PRICE_CENTS * (1 - discountPercent / 100));

      const trialEnd = Math.floor(Date.now() / 1000) + TRIAL_DAYS * 86400;

      const subscription = await s.subscriptions.create({
        customer: input.stripeCustomerId,
        items: [{ price_data: { currency: "usd", unit_amount: finalAmountCents, recurring: { interval: "year" }, product_data: { name: "ReserVamos Annual Plan" } } }],
        trial_end: trialEnd,
        default_payment_method: input.stripePaymentMethodId,
        payment_settings: { save_default_payment_method: "on_subscription" },
      });

      const clientResult = await rawDb.execute(
        "INSERT INTO clients (name, email, password_hash, status, apiKey, primaryColor, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
        [input.companyName, input.email, input.password, "active", require("crypto").randomUUID(), "#C75E3A"]
      );
      const clientId = Number((clientResult as any).insertId);

      await rawDb.execute(
        `INSERT INTO client_subscriptions (clientId, trialStart, trialEnd, planStart, planEnd, status, annual_price, couponCode, discountApplied, finalAmount, stripeCustomerId, stripeSubscriptionId, stripePaymentMethodId) VALUES (?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), NULL, NULL, "trial", ?, ?, ?, ?, ?, ?, ?)`,
        [clientId, TRIAL_DAYS, ANNUAL_PRICE_CENTS / 100, couponCode, discountPercent, finalAmountCents / 100, input.stripeCustomerId, subscription.id, input.stripePaymentMethodId]
      );

      if (couponCode) {
        await rawDb.execute("UPDATE coupons SET uses_count = uses_count + 1 WHERE code = ?", [couponCode]);
      }

      return {
        clientId,
        trialEnd: new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString(),
        apiKey: "rk_" + require("crypto").randomBytes(16).toString("hex"),
      };
    }),

  webhook: publicQuery
    .input(z.object({ signature: z.string(), payload: z.string() }))
    .mutation(async ({ input }) => {
      const secret = getWebhookSecret();
      if (!secret) throw new Error("Webhook secret not configured");
      const s = getStripe();
      let event;
      try {
        event = s.webhooks.constructEvent(input.payload, input.signature, secret);
      } catch (err: any) {
        throw new Error(`Webhook signature verification failed: ${err.message}`);
      }
      const rawDb = getRawDb();
      switch (event.type) {
        case "invoice.payment_succeeded":
          await rawDb.execute("UPDATE client_subscriptions SET status='active', planStart=NOW(), planEnd=DATE_ADD(NOW(), INTERVAL 1 YEAR) WHERE stripeSubscriptionId=?", [event.data.object.subscription]);
          break;
        case "invoice.payment_failed":
          await rawDb.execute("UPDATE client_subscriptions SET status='expired' WHERE stripeSubscriptionId=?", [event.data.object.subscription]);
          break;
        case "customer.subscription.deleted":
          await rawDb.execute("UPDATE client_subscriptions SET status='cancelled' WHERE stripeSubscriptionId=?", [event.data.object.id]);
          break;
      }
      return { received: true };
    }),
});
