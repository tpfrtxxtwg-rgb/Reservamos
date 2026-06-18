/**
 * Subscription Check — Validates that a client has an active subscription.
 * Used by middleware and cron jobs.
 */
import { getRawDb } from "../queries/connection";

export type SubscriptionStatus = "trial" | "active" | "expired" | "cancelled" | "none";

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  trialEnd: Date | null;
  trialDaysLeft: number;
  planEnd: Date | null;
  annualPrice: number;
  finalAmount: number;
  discountApplied: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export async function getClientSubscription(clientId: number): Promise<SubscriptionInfo> {
  const rawDb = getRawDb();

  const [rows] = await rawDb.execute(
    `SELECT status, trial_start, trial_end, plan_start, plan_end,
            annual_price, final_amount, discount_applied,
            stripe_customer_id, stripe_subscription_id
     FROM client_subscriptions
     WHERE clientId = ?
     LIMIT 1`,
    [clientId]
  );

  const sub = (rows as any[])[0];

  if (!sub) {
    return {
      status: "none",
      trialEnd: null,
      trialDaysLeft: 0,
      planEnd: null,
      annualPrice: 600,
      finalAmount: 600,
      discountApplied: 0,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    };
  }

  const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;
  const trialDaysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    status: sub.status as SubscriptionStatus,
    trialEnd,
    trialDaysLeft,
    planEnd: sub.plan_end ? new Date(sub.plan_end) : null,
    annualPrice: parseFloat(sub.annual_price) || 600,
    finalAmount: parseFloat(sub.final_amount) || 600,
    discountApplied: sub.discount_applied || 0,
    stripeCustomerId: sub.stripe_customer_id || null,
    stripeSubscriptionId: sub.stripe_subscription_id || null,
  };
}

/**
 * Check if a client subscription is active (trial or paid).
 * Returns { valid: true } or { valid: false, reason, status }.
 */
export async function validateClientSubscription(
  clientId: number
): Promise<{ valid: true } | { valid: false; reason: string; status: SubscriptionStatus; trialDaysLeft: number }> {
  const info = await getClientSubscription(clientId);

  if (info.status === "active" || info.status === "trial") {
    return { valid: true };
  }

  if (info.status === "expired") {
    return { valid: false, reason: "Your subscription has expired. Please renew to continue.", status: "expired", trialDaysLeft: 0 };
  }

  if (info.status === "cancelled") {
    return { valid: false, reason: "Your subscription has been cancelled. Please contact support.", status: "cancelled", trialDaysLeft: 0 };
  }

  return { valid: false, reason: "No active subscription found.", status: "none", trialDaysLeft: 0 };
}

/**
 * Auto-expire trials that have passed their end date.
 * Called by cron job. Returns count of expired subscriptions.
 */
export async function expireFinishedTrials(): Promise<number> {
  const rawDb = getRawDb();

  const [result] = await rawDb.execute(
    `UPDATE client_subscriptions
     SET status = 'expired', updated_at = NOW()
     WHERE status = 'trial'
       AND trial_end < NOW()`,
    []
  );

  const affected = (result as any).affectedRows || 0;
  return affected;
}

/**
 * Get clients whose trial expires soon (for reminder emails).
 * daysBefore: how many days before expiry to notify (default: 3)
 */
export async function getExpiringTrials(daysBefore: number = 3): Promise<
  { clientId: number; email: string; name: string; trialEnd: Date }[]
> {
  const rawDb = getRawDb();

  const [rows] = await rawDb.execute(
    `SELECT cs.clientId, c.email, c.name, cs.trial_end
     FROM client_subscriptions cs
     JOIN clients c ON c.id = cs.clientId
     WHERE cs.status = 'trial'
       AND cs.trial_end BETWEEN DATE_ADD(NOW(), INTERVAL ? DAY)
                            AND DATE_ADD(NOW(), INTERVAL ? DAY)`,
    [daysBefore, daysBefore + 1]
  );

  return (rows as any[]).map((r) => ({
    clientId: r.clientId,
    email: r.email,
    name: r.name,
    trialEnd: new Date(r.trial_end),
  }));
}
