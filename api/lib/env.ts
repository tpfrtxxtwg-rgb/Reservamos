import "dotenv/config";

// Log available env vars for debugging (without exposing values)
const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;
console.log(`[ENV] NODE_ENV=${process.env.NODE_ENV}, DATABASE_URL exists=${!!process.env.DATABASE_URL}, STRIPE_SECRET_KEY exists=${hasStripeKey}, STRIPE_WEBHOOK_SECRET exists=${hasWebhookSecret}`);

export const env = {
  appId: process.env.APP_ID || process.env.VITE_APP_ID || "",
  appSecret: process.env.APP_SECRET || "",
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: process.env.DATABASE_URL || "",
  kimiAuthUrl: process.env.KIMI_AUTH_URL || "https://auth.kimi.com",
  kimiOpenUrl: process.env.KIMI_OPEN_URL || "https://open.kimi.com",
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
  // Owner Stripe account for subscription payments
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
};
