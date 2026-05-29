import { z } from "zod";
import { createRouter, superAdminQuery } from "./middleware";
import { getRawDb } from "./queries/connection";

export const companiesRouter = createRouter({
  // Admin: List all companies with subscription info
  list: superAdminQuery.query(async () => {
    const rawDb = getRawDb();
    try {
      const [rows] = await rawDb.execute(
        `SELECT 
          c.id, c.name, c.email, c.apiKey, c.status as clientStatus,
          c.primaryColor, c.createdAt as registeredAt,
          cs.trialStart, cs.trialEnd, cs.planStart, cs.planEnd,
          cs.status as subscriptionStatus,
          cs.annualPrice, cs.couponCode, cs.discountApplied, cs.finalAmount,
          cs.stripeCustomerId, cs.stripeSubscriptionId
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
          trialStart: row.trialStart,
          trialEnd: row.trialEnd,
          trialDaysLeft,
          planStart: row.planStart,
          planEnd: row.planEnd,
          planDaysLeft,
          subscriptionStatus: row.subscriptionStatus || 'none',
          annualPrice: row.annualPrice,
          couponCode: row.couponCode,
          discountApplied: row.discountApplied,
          finalAmount: row.finalAmount,
          stripeCustomerId: row.stripeCustomerId,
        };
      });
    } catch (err: any) {
      console.error("[Companies] list error:", err?.message);
      return [];
    }
  }),

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
