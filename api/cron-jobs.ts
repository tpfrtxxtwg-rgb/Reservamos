/**
 * Cron Jobs — Periodic background tasks
 * - Expire finished trials daily
 * - Send trial reminder emails 3 days before expiry
 */
import { expireFinishedTrials, getExpiringTrials, getClientSubscription } from "./lib/subscription-check";
import { sendWelcomeEmail } from "./lib/welcome-email";
import { getRawDb } from "./queries/connection";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

let started = false;

/**
 * Start all background cron jobs.
 * Safe to call multiple times — only starts once.
 */
export function startCronJobs() {
  if (started) return;
  started = true;

  console.log("[cron] Starting background jobs...");

  // Job 1: Expire finished trials — runs every 6 hours
  scheduleJob("expire-trials", 6 * HOUR_MS, async () => {
    console.log("[cron] Checking for expired trials...");
    const count = await expireFinishedTrials();
    if (count > 0) {
      console.log(`[cron] Expired ${count} trial subscription(s)`);
    }
  });

  // Job 2: Send trial reminders — runs every 24 hours at 10 AM UTC
  // Using setTimeout to align with 10 AM UTC
  const now = new Date();
  const next10am = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 10, 0, 0));
  if (next10am.getTime() <= now.getTime()) {
    next10am.setUTCDate(next10am.getUTCDate() + 1);
  }
  const delayTo10am = next10am.getTime() - now.getTime();

  setTimeout(() => {
    runReminderJob();
    // Then every 24 hours
    setInterval(runReminderJob, DAY_MS);
  }, delayTo10am);

  console.log(`[cron] Reminder job scheduled for ${next10am.toISOString()}`);
}

function scheduleJob(name: string, intervalMs: number, fn: () => Promise<void>) {
  // Run immediately on start
  fn().catch((e) => console.error(`[cron/${name}] Error:`, e));

  // Then repeat
  setInterval(() => {
    fn().catch((e) => console.error(`[cron/${name}] Error:`, e));
  }, intervalMs);
}

async function runReminderJob() {
  console.log("[cron/reminders] Checking for trials expiring soon...");

  try {
    // Day -3 reminder
    const day3 = await getExpiringTrials(3);
    for (const client of day3) {
      console.log(`[cron/reminders] Sending 3-day reminder to ${client.email}`);
      const info = await getClientSubscription(client.clientId);
      await sendWelcomeEmail({
        companyName: client.name,
        email: client.email,
        apiKey: "", // not needed for reminder
        trialEnd: client.trialEnd.toISOString(),
        lang: "es", // default, could be stored per client
      }).catch((e) => console.error(`[cron/reminders] Failed:`, e));
    }

    // Day -1 reminder (final)
    const day1 = await getExpiringTrials(1);
    for (const client of day1) {
      console.log(`[cron/reminders] Sending final 1-day reminder to ${client.email}`);
      // Could send a different "last chance" email template
    }

    console.log(`[cron/reminders] Sent ${day3.length + day1.length} reminder(s)`);
  } catch (e: any) {
    console.error("[cron/reminders] Error:", e.message);
  }
}
