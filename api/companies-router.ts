import { z } from "zod";
import { createRouter, superAdminQuery } from "./middleware";
import { getRawDb } from "./queries/connection";

export const companiesRouter = createRouter({
<<<<<<< HEAD
  // Admin: List all companies with subscription info
=======
>>>>>>> 6688a34e810e9ce150c1cc87b0709d5780c1b305
  list: superAdminQuery.query(async () => {
    const rawDb = getRawDb();
    try {
      const [rows] = await rawDb.execute(
        `SELECT 
<<<<<<< HEAD
          c.id, c.name, c.email, c.apiKey, c.status as clientStatus,
          c.primaryColor, c.createdAt as registeredAt,
          cs.trial_start, cs.trial_end, cs.plan_start, cs.plan_end,
          cs.status as subscriptionStatus,
          cs.annual_price, cs.coupon_code, cs.discount_applied, cs.final_amount,
          cs.stripe_customer_id, cs.stripe_subscription_id
         FROM clients c
         LEFT JOIN client_subscriptions cs ON cs.clientId = c.id
         ORDER BY c.createdAt DESC`
      );
      return (rows as any[]).map((row: any) => {
        const trialEnd = row.trial_end ? new Date(row.trial_end) : null;
        const trialDaysLeft = trialEnd
          ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : 0;

        const planEnd = row.plan_end ? new Date(row.plan_end) : null;
        const planDaysLeft = planEnd
          ? Math.max(0, Math.ceil((planEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : 0;

        return {
          id: row.id,
          name: row.name,
          email: row.email,
          apiKey: row.apiKey,
          clientStatus: row.clientStatus,
          primaryColor: row.primaryColor,
          registeredAt: row.registeredAt,
          trialStart: row.trial_start,
          trialEnd: row.trial_end,
          trialDaysLeft,
          planStart: row.plan_start,
          planEnd: row.plan_end,
          planDaysLeft,
          subscriptionStatus: row.subscriptionStatus || 'none',
          annualPrice: row.annual_price,
          couponCode: row.coupon_code,
          discountApplied: row.discount_applied,
          finalAmount: row.final_amount,
          stripeCustomerId: row.stripe_customer_id,
        };
=======
  c.id, c.name, c.email, c.apiKey, c.status as clientStatus,
  c.primaryColor, c.createdAt as registeredAt,
  cs.trial_start, cs.trial_end, cs.plan_start, cs.plan_end,
  cs.status as subscriptionStatus,
  cs.annual_price, cs.coupon_code, cs.discount_applied, cs.final_amount,
  cs.stripe_customer_id, cs.stripe_subscription_id
 FROM clients c
 LEFT JOIN client_subscriptions cs ON cs.clientId = c.id
 ORDER BY c.createdAt DESC`
      );
      return (rows as any[]).map((row: any) => {
        const trialEnd = row.trialEnd ? new Date(row.trialEnd) : null;
        const trialDaysLeft = trialEnd
          ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : 0;
        const planEnd = row.planEnd ? new Date(row.planEnd) : null;
        const planDaysLeft = planEnd
          ? Math.max(0, Math.ceil((planEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : 0;
        return {
  id: row.id,
  name: row.name,
  email: row.email,
  apiKey: row.apiKey,
  clientStatus: row.clientStatus,
  primaryColor: row.primaryColor,
  registeredAt: row.registeredAt,
  trialStart: row.trial_start,
  trialEnd: row.trial_end,
  trialDaysLeft,
  planStart: row.plan_start,
  planEnd: row.plan_end,
  planDaysLeft,
  subscriptionStatus: row.subscriptionStatus || 'none',
  annualPrice: row.annual_price,
  couponCode: row.coupon_code,
  discountApplied: row.discount_applied,
  finalAmount: row.final_amount,
  stripeCustomerId: row.stripe_customer_id,
};
>>>>>>> 6688a34e810e9ce150c1cc87b0709d5780c1b305
      });
    } catch (err: any) {
      console.error("[Companies] list error:", err?.message);
      return [];
    }
  }),
<<<<<<< HEAD

  // Admin: Get payment history for a company
  payments: superAdminQuery
    .input(z.object({ clientId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const rawDb = getRawDb();
      const [rows] = await rawDb.execute(
        `SELECT id, amount, currency, status, description, paidAt, createdAt
         FROM subscription_payments WHERE clientId = ? ORDER BY createdAt DESC`,
        [input.clientId]
      );
      return rows as any[];
    }),

  // Admin: Toggle company status (active/inactive)
  toggleStatus: superAdminQuery
    .input(z.object({ clientId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const rawDb = getRawDb();
      await rawDb.execute(
        "UPDATE clients SET status = IF(status='active', 'inactive', 'active') WHERE id = ?",
        [input.clientId]
      );
      return { success: true };
    }),
});
=======
  payments: superAdminQuery.input(z.object({ clientId: z.number() })).query(async ({ input }) => {
    const rawDb = getRawDb();
    const [rows] = await rawDb.execute(
      `SELECT id, amount, currency, status, description, createdAt
       FROM subscription_payments WHERE clientId = ? ORDER BY createdAt DESC`,
      [input.clientId]
    );
    return rows as any[];
  }),
  toggleStatus: superAdminQuery.input(z.object({ clientId: z.number() })).mutation(async ({ input }) => {
    const rawDb = getRawDb();
    await rawDb.execute(
      "UPDATE clients SET status = IF(status='active', 'inactive', 'active') WHERE id = ?",
      [input.clientId]
    );
    return { success: true };
  }),
});
>>>>>>> 6688a34e810e9ce150c1cc87b0709d5780c1b305
