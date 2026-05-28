import { z } from "zod";
import Stripe from "stripe";
import { createRouter, publicQuery } from "./middleware";
import { getRawDb } from "./queries/connection";

const ANNUAL_PRICE_CENTS = 60000; // $600.00 USD in cents
const TRIAL_DAYS = 7;

/** Get Stripe instance from env, reading fresh each time */
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (!key) throw new Error("Stripe not configured. Set STRIPE_SECRET_KEY env var.");
  return new Stripe(key, { apiVersion: "2025-03-31.basil" });
}

/** Get webhook secret from env */
function getWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET || "";
}

export const stripeSubscriptionRouter = createRouter({
  // Check if Stripe is configured
  checkConfig: publicQuery.query(() => {
    const configured = !!process.env.STRIPE_SECRET_KEY;
    return { configured };
  }),

  // Step 1: Create a Stripe customer and setup intent for card collection
  createSetupIntent: publicQuery
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const s = getStripe();

      const customer = await s.customers.create({
        email: input.email,
        name: input.name,
      });

      const setupIntent = await s.setupIntents.create({
        customer: customer.id,
        usage: "off_session",
        payment_method_types: ["card"],
      });

      return {
        customerId: customer.id,
        clientSecret: setupIntent.client_secret,
      };
    }),

  // Step 2: Create subscription with trial after card is collected
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

      // Validate coupon
      let discountPercent = 0;
      if (input.couponCode) {
        const [couponRows] = await rawDb.execute(
          "SELECT discountPercent, maxUses, usesCount, active, validUntil FROM coupons WHERE code = ? LIMIT 1",
          [input.couponCode.toUpperCase()]
        );
        const coupon = (couponRows as any[])[0];
        if (coupon) {
          const isActive = coupon.active === 1 || coupon.active === true;
          const notExpired = !coupon.validUntil || new Date(coupon.validUntil) > new Date();
          const hasUses = coupon.usesCount < coupon.maxUses;
          if (isActive && notExpired && hasUses) {
            discountPercent = coupon.discountPercent;
          }
        }
      }

      const discountMultiplier = 1 - discountPercent / 100;
      const finalAmountCents = Math.round(ANNUAL_PRICE_CENTS * discountMultiplier);

      // Attach payment method
      await s.paymentMethods.attach(input.paymentMethodId, {
        customer: input.customerId,
      });

      await s.customers.update(input.customerId, {
        invoice_settings: { default_payment_method: input.paymentMethodId },
      });

      // Create subscription with trial
      const trialEnd = Math.floor(Date.now() / 1000) + TRIAL_DAYS * 24 * 60 * 60;

      const subscription = await s.subscriptions.create({
        customer: input.customerId,
        items: [{
          price_data: {
            currency: "usd",
            unit_amount: finalAmountCents,
            recurring: { interval: "year" },
            product_data: {
              name: "ReserVamos Annual Plan",
              description: `${TRIAL_DAYS}-day trial, then $${(finalAmountCents / 100).toFixed(2)}/year`,
            },
          },
        }],
        trial_end: trialEnd,
        payment_settings: {
          save_default_payment_method: "on_subscription",
        },
        metadata: {
          companyName: input.companyName,
          couponCode: input.couponCode || "",
          discountPercent: String(discountPercent),
        },
      });

      // Create client
      const apiKey = `rv_${Buffer.from(Math.random().toString()).toString("base64").slice(0, 20).replace(/[^a-zA-Z0-9]/g, "")}_${Date.now().toString(36)}`;

      const [insertResult] = await rawDb.execute(
        `INSERT INTO clients (name, email, password, apiKey, status, primaryColor, currency, timezone)
         VALUES (?, ?, ?, ?, 'active', '#C75E3A', 'USD', 'America/Cancun')`,
        [input.companyName, input.companyEmail, input.companyPassword, apiKey]
      );
      const clientId = Number((insertResult as any).insertId);

      // Create subscription record
      const trialStart = new Date();
      const trialEndDate = new Date(trialStart.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

      await rawDb.execute(
        `INSERT INTO client_subscriptions
         (clientId, trialStart, trialEnd, status, annualPrice, couponCode, discountApplied, finalAmount,
          stripeCustomerId, stripeSubscriptionId, stripePaymentMethodId)
         VALUES (?, ?, ?, 'trial', 600.00, ?, ?, ?, ?, ?, ?)`,
        [
          clientId, trialStart, trialEndDate,
          input.couponCode?.toUpperCase() || null,
          discountPercent,
          (finalAmountCents / 100).toFixed(2),
          input.customerId,
          subscription.id,
          input.paymentMethodId,
        ]
      );

      // Mark coupon used
      if (input.couponCode && discountPercent > 0) {
        await rawDb.execute(
          "UPDATE coupons SET usesCount = usesCount + 1 WHERE code = ?",
          [input.couponCode.toUpperCase()]
        );
      }

      return {
        clientId,
        apiKey,
        trialEnd: trialEndDate.toISOString(),
        subscriptionId: subscription.id,
        discountApplied: discountPercent,
        finalAmount: finalAmountCents / 100,
      };
    }),

  // Get subscription status
  getStatus: publicQuery
    .input(z.object({ clientId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const rawDb = getRawDb();
      const [rows] = await rawDb.execute(
        `SELECT status, trialStart, trialEnd, planStart, planEnd,
          annualPrice, couponCode, discountApplied, finalAmount
         FROM client_subscriptions WHERE clientId = ? LIMIT 1`,
        [input.clientId]
      );
      const sub = (rows as any[])[0];
      if (!sub) return { status: "none", trialDaysLeft: 0 };

      const trialEnd = sub.trialEnd ? new Date(sub.trialEnd) : null;
      const trialDaysLeft = trialEnd
        ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

      return { status: sub.status, trialDaysLeft, trialEnd: sub.trialEnd, planEnd: sub.planEnd };
    }),

  // Stripe webhook handler
  webhook: publicQuery
    .input(z.object({
      signature: z.string(),
      payload: z.string(),
    }))
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
          const invoice = event.data.object as Stripe.Invoice;
          const subId = invoice.subscription as string;
          await rawDb.execute(
            "UPDATE client_subscriptions SET status='active', planStart=NOW(), planEnd=DATE_ADD(NOW(), INTERVAL 1 YEAR) WHERE stripeSubscriptionId=?",
            [subId]
          );
          await rawDb.execute(
            "UPDATE subscription_payments SET status='succeeded', paidAt=NOW(), stripePaymentIntentId=? WHERE stripeInvoiceId=?",
            [invoice.payment_intent as string, invoice.id]
          );
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const subId = invoice.subscription as string;
          await rawDb.execute("UPDATE client_subscriptions SET status='expired' WHERE stripeSubscriptionId=?", [subId]);
          await rawDb.execute("UPDATE subscription_payments SET status='failed' WHERE stripeInvoiceId=?", [invoice.id]);
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          await rawDb.execute("UPDATE client_subscriptions SET status='cancelled' WHERE stripeSubscriptionId=?", [subscription.id]);
          break;
        }
      }
      return { received: true, type: event.type };
    }),
});
