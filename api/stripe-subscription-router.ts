import { z } from "zod";
import Stripe from "stripe";
import bcrypt from "bcryptjs";
import { createRouter, publicQuery, superAdminQuery } from "./middleware";
import { getRawDb } from "./queries/connection";
import { sendWelcomeEmail } from "./email-router";

const ANNUAL_PRICE_CENTS = 60000;
const TRIAL_DAYS = 7;

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (!key) throw new Error("Stripe not configured. Set STRIPE_SECRET_KEY env var.");
  return new Stripe(key, { apiVersion: "2025-08-27.basil" });
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
      customerId: z.string().min(1),
      paymentMethodId: z.string().min(1),
      companyName: z.string().min(1),
      companyEmail: z.string().email(),
      companyPassword: z.string().min(6),
      couponCode: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const s = getStripe();
      const rawDb = getRawDb();

      let discountPercent = 0;
      if (input.couponCode) {
        const [couponRows] = await rawDb.execute(
          "SELECT discount_percent as discountPercent, max_uses as maxUses, uses_count as usesCount, active, valid_until as validUntil FROM coupons WHERE code = ? LIMIT 1",
          [input.couponCode.toUpperCase()]
        );
        const coupon = (couponRows as any[])[0];
        if (coupon) {
          const isActive = coupon.active === 1 || coupon.active === true;
          const notExpired = !coupon.validUntil || new Date(coupon.validUntil) > new Date();
          const hasUses = coupon.usesCount < coupon.maxUses;
          if (isActive && notExpired && hasUses) discountPercent = coupon.discountPercent;
        }
      }

      const discountMultiplier = 1 - discountPercent / 100;
      const finalAmountCents = Math.round(ANNUAL_PRICE_CENTS * discountMultiplier);

      await s.paymentMethods.attach(input.paymentMethodId, { customer: input.customerId });
      await s.customers.update(input.customerId, {
        invoice_settings: { default_payment_method: input.paymentMethodId },
      });

      const trialEnd = Math.floor(Date.now() / 1000) + TRIAL_DAYS * 24 * 60 * 60;

      const product = await s.products.create({
        name: "ReserVamos Annual Plan",
        description: `${TRIAL_DAYS}-day trial, then $${(finalAmountCents / 100).toFixed(2)}/year`,
      });

      const price = await s.prices.create({
        product: product.id,
        unit_amount: finalAmountCents,
        currency: "usd",
        recurring: { interval: "year" },
      });

      const subscription = await s.subscriptions.create({
        customer: input.customerId,
        items: [{ price: price.id }],
        trial_end: trialEnd,
        payment_settings: { save_default_payment_method: "on_subscription" },
        metadata: { companyName: input.companyName, couponCode: input.couponCode || "", discountPercent: String(discountPercent) },
      });

      const apiKey = `rv_${Buffer.from(Math.random().toString()).toString("base64").slice(0, 20).replace(/[^a-zA-Z0-9]/g, "")}_${Date.now().toString(36)}`;
      const passwordHash = await bcrypt.hash(input.companyPassword, 12);

      const [insertResult] = await rawDb.execute(
        `INSERT INTO clients (name, email, apiKey, status, primaryColor)
         VALUES (?, ?, ?, 'active', '#C75E3A')`,
        [input.companyName, input.companyEmail, apiKey]
      );
      const clientId = Number((insertResult as any).insertId);

      await rawDb.execute(
        `INSERT INTO client_users (client_id, email, password_hash, name, role, active, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'owner', true, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           client_id = VALUES(client_id),
           password_hash = VALUES(password_hash),
           name = VALUES(name),
           role = 'owner',
           updated_at = NOW()`,
        [clientId, input.companyEmail, passwordHash, input.companyName]
      );

      const trialStart = new Date();
      const trialEndDate = new Date(trialStart.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

      await rawDb.execute(
        `INSERT INTO client_subscriptions
         (clientId, trial_start, trial_end, status, annual_price, coupon_code, discount_applied, final_amount,
          stripe_customer_id, stripe_subscription_id, stripe_payment_method_id)
         VALUES (?, ?, ?, 'trial', 600.00, ?, ?, ?, ?, ?, ?)`,
        [
          clientId, trialStart, trialEndDate,
          input.couponCode?.toUpperCase() || null,
          discountPercent,
          (finalAmountCents / 100).toFixed(2),
          input.customerId, subscription.id, input.paymentMethodId,
        ]
      );

      if (input.couponCode && discountPercent > 0) {
        await rawDb.execute("UPDATE coupons SET uses_count = uses_count + 1 WHERE code = ?", [input.couponCode.toUpperCase()]);
      }

      // Send welcome email asynchronously (don't block the response)
      sendWelcomeEmail(clientId, input.companyEmail, input.companyName, trialEndDate.toISOString())
        .then((result) => {
          console.log(`[Register] Welcome email result:`, result);
        })
        .catch((err: any) => {
          console.error("[Register] Welcome email failed:", err?.message || err);
        });

      return {
        clientId, apiKey,
        trialEnd: trialEndDate.toISOString(),
        subscriptionId: subscription.id,
        discountApplied: discountPercent,
        finalAmount: finalAmountCents / 100,
      };
    }),

  getStatus: publicQuery
    .input(z.object({ clientId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const rawDb = getRawDb();
      const [rows] = await rawDb.execute(
        `SELECT status, trial_start, trial_end, plan_start, plan_end,
          annual_price, coupon_code, discount_applied, final_amount
         FROM client_subscriptions WHERE clientId = ? LIMIT 1`, [input.clientId]
      );
      const sub = (rows as any[])[0];
      if (!sub) return { status: "none", trialDaysLeft: 0 };
      const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;
      const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
      return { status: sub.status, trialDaysLeft, trialEnd: sub.trial_end, planEnd: sub.plan_end };
    }),

  // Admin: Force activate a subscription when payment was received but webhook failed
  forceActivate: superAdminQuery
    .input(z.object({ clientId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const rawDb = getRawDb();
      const [rows] = await rawDb.execute(
        `SELECT stripe_subscription_id, status, final_amount FROM client_subscriptions WHERE clientId = ? LIMIT 1`,
        [input.clientId]
      );
      const sub = (rows as any[])[0];
      if (!sub) throw new Error("Subscription not found");

      // Update to active with 1-year plan
      await rawDb.execute(
        `UPDATE client_subscriptions SET status='active', plan_start=NOW(), plan_end=DATE_ADD(NOW(), INTERVAL 1 YEAR) WHERE clientId=?`,
        [input.clientId]
      );

      // Also record a payment
      try {
        await rawDb.execute(
          `INSERT INTO subscription_payments (clientId, amount, currency, status, description, paid_at, created_at)
           VALUES (?, ?, 'USD', 'succeeded', 'Annual plan - manual activation', NOW(), NOW())`,
          [input.clientId, sub.final_amount || 600.00]
        );
      } catch (e: any) {
        console.error("[forceActivate] Payment record insert failed:", e.message);
      }

      return { success: true, previousStatus: sub.status, newStatus: 'active' };
    }),

  // Admin: Record a payment for an active subscription (when payment was received but not recorded)
  recordPayment: superAdminQuery
    .input(z.object({ clientId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const rawDb = getRawDb();
      const [rows] = await rawDb.execute(
        `SELECT final_amount, status FROM client_subscriptions WHERE clientId = ? LIMIT 1`,
        [input.clientId]
      );
      const sub = (rows as any[])[0];
      if (!sub) throw new Error("Subscription not found");

      await rawDb.execute(
        `INSERT INTO subscription_payments (clientId, amount, currency, status, description, paid_at, created_at)
         VALUES (?, ?, 'USD', 'succeeded', 'Annual plan payment', NOW(), NOW())`,
        [input.clientId, sub.final_amount || 600.00]
      );

      return { success: true, amount: sub.final_amount || 600.00 };
    }),

  // Admin: Sync subscription status with Stripe
  syncWithStripe: superAdminQuery
    .input(z.object({ clientId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const rawDb = getRawDb();
      const s = getStripe();

      const [rows] = await rawDb.execute(
        `SELECT stripe_subscription_id, status FROM client_subscriptions WHERE clientId = ? LIMIT 1`,
        [input.clientId]
      );
      const sub = (rows as any[])[0];
      if (!sub?.stripe_subscription_id) throw new Error("No Stripe subscription found");

      const stripeSub = await s.subscriptions.retrieve(sub.stripe_subscription_id);
      const stripeStatus = stripeSub.status;

      let newStatus = sub.status;
      if (stripeStatus === 'active' || stripeStatus === 'trialing') {
        newStatus = 'active';
      } else if (stripeStatus === 'canceled' || stripeStatus === 'cancelled') {
        newStatus = 'cancelled';
      } else if (stripeStatus === 'past_due' || stripeStatus === 'unpaid') {
        newStatus = 'expired';
      }

      if (newStatus !== sub.status) {
        await rawDb.execute(
          "UPDATE client_subscriptions SET status = ? WHERE clientId = ?",
          [newStatus, input.clientId]
        );
      }

      return { success: true, stripeStatus, previousStatus: sub.status, newStatus };
    }),

  webhook: publicQuery
    .input(z.object({ signature: z.string(), payload: z.string() }))
    .mutation(async ({ input }) => {
      const secret = getWebhookSecret();
      if (!secret) throw new Error("Webhook secret not configured");
      const s = getStripe();
      let event: Stripe.Event;
      try {
        event = s.webhooks.constructEvent(input.payload, input.signature, secret);
      } catch (err: any) {
        throw new Error(`Webhook verification failed: ${err.message}`);
      }
      const rawDb = getRawDb();
      switch (event.type) {
        case "invoice.payment_succeeded": {
          const invoice = event.data.object as any;
          const subId = invoice.subscription as string;
          await rawDb.execute(
            "UPDATE client_subscriptions SET status='active', plan_start=NOW(), plan_end=DATE_ADD(NOW(), INTERVAL 1 YEAR) WHERE stripe_subscription_id=?",
            [subId]
          );
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object as any;
          const subId = invoice.subscription as string;
          await rawDb.execute("UPDATE client_subscriptions SET status='expired' WHERE stripe_subscription_id=?", [subId]);
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          await rawDb.execute("UPDATE client_subscriptions SET status='cancelled' WHERE stripe_subscription_id=?", [subscription.id]);
          break;
        }
      }
      return { received: true, type: event.type };
    }),
});
