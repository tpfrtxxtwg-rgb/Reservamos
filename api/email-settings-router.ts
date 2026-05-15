import { z } from "zod";
import { createRouter, clientAuthedQuery } from "./middleware";
import { getRawDb } from "./queries/connection";

async function testSendgrid(apiKey: string) {
  try {
    const response = await fetch("https://api.sendgrid.com/v3/user/profile", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (response.ok) {
      return { success: true, message: "SendGrid API key is valid" };
    }
    return { success: false, message: `SendGrid API error: ${response.status}` };
  } catch (err: any) {
    return { success: false, message: err.message || "SendGrid connection failed" };
  }
}

async function testResend(apiKey: string) {
  try {
    const response = await fetch("https://api.resend.com/api-keys", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (response.ok || response.status === 403) {
      return { success: true, message: "Resend API key is valid" };
    }
    return { success: false, message: `Resend API error: ${response.status}` };
  } catch (err: any) {
    return { success: false, message: err.message || "Resend connection failed" };
  }
}

function mapRowToSettings(row: any) {
  const smtpHost = row.smtp_host || "";
  const smtpUser = row.smtp_user || "";
  const smtpFrom = row.smtp_from || "";
  const emailProvider = smtpHost === "resend" ? "resend" : "sendgrid";

  return {
    id: row.id,
    clientId: row.clientId,
    enabled: Boolean(row.enabled),
    subject: row.subject || "Your Reservation Confirmation",
    message: row.message || "Thank you for your reservation. We look forward to serving you.",
    pickupInstructions: row.pickupInstructions || "",
    smtpFrom,
    companyPhone: row.company_phone || "",
    companyWebsite: row.company_website || "",
    emailProvider,
    sendgridApiKey: emailProvider === "sendgrid" ? smtpUser : "",
    resendApiKey: emailProvider === "resend" ? smtpUser : "",
  };
}

function defaultSettings() {
  return {
    enabled: true,
    subject: "Your Reservation Confirmation",
    message: "Thank you for your reservation. We look forward to serving you.",
    pickupInstructions: "",
    smtpFrom: "",
    companyPhone: "",
    companyWebsite: "",
    emailProvider: "sendgrid" as const,
    sendgridApiKey: "",
    resendApiKey: "",
  };
}

export const emailSettingsRouter = createRouter({
  get: clientAuthedQuery.query(async ({ ctx }) => {
    try {
      const pool = getRawDb();
      const [rows] = await pool.execute(
        `SELECT id, clientId, enabled, subject, message, pickupInstructions,
                smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from,
                company_phone, company_website, created_at, updated_at
         FROM client_email_settings WHERE clientId = ? LIMIT 1`,
        [ctx.clientUser.clientId]
      );

      const row = (rows as any[])[0];
      if (!row) return defaultSettings();
      return mapRowToSettings(row);
    } catch (err: any) {
      console.error("[EmailSettings] get error:", err.message);
      return defaultSettings();
    }
  }),

  update: clientAuthedQuery
    .input(
      z.object({
        enabled: z.boolean().optional(),
        subject: z.string().max(255).optional(),
        message: z.string().optional(),
        pickupInstructions: z.string().optional(),
        emailProvider: z.enum(["sendgrid", "resend"]).optional(),
        smtpFrom: z.string().max(320).optional().nullable(),
        sendgridApiKey: z.string().max(255).optional().nullable(),
        resendApiKey: z.string().max(255).optional().nullable(),
        companyPhone: z.string().max(50).optional().nullable(),
        companyWebsite: z.string().max(255).optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const clientId = ctx.clientUser.clientId;
      const pool = getRawDb();
      console.log(`[EmailSettings] Saving for clientId=${clientId}`);

      const isSendgrid = input.emailProvider === "sendgrid" || !input.emailProvider;
      const smtpHost = isSendgrid ? "sendgrid" : "resend";
      const smtpUser = isSendgrid ? input.sendgridApiKey : input.resendApiKey;

      try {
        // Check if record exists
        const [existing] = await pool.execute(
          `SELECT id FROM client_email_settings WHERE clientId = ? LIMIT 1`,
          [clientId]
        );

        if ((existing as any[]).length > 0) {
          // UPDATE
          await pool.execute(
            `UPDATE client_email_settings SET
              enabled = ?, subject = ?, message = ?, pickupInstructions = ?,
              smtp_host = ?, smtp_user = ?, smtp_from = ?,
              company_phone = ?, company_website = ?
             WHERE clientId = ?`,
            [
              input.enabled ?? true,
              input.subject ?? "Your Reservation Confirmation",
              input.message ?? "Thank you for your reservation. We look forward to serving you.",
              input.pickupInstructions ?? "",
              smtpHost,
              smtpUser,
              input.smtpFrom ?? "",
              input.companyPhone ?? "",
              input.companyWebsite ?? "",
              clientId,
            ]
          );
        } else {
          // INSERT
          await pool.execute(
            `INSERT INTO client_email_settings
              (clientId, enabled, subject, message, pickupInstructions,
               smtp_host, smtp_user, smtp_from,
               company_phone, company_website)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              clientId,
              input.enabled ?? true,
              input.subject ?? "Your Reservation Confirmation",
              input.message ?? "Thank you for your reservation. We look forward to serving you.",
              input.pickupInstructions ?? "",
              smtpHost,
              smtpUser,
              input.smtpFrom ?? "",
              input.companyPhone ?? "",
              input.companyWebsite ?? "",
            ]
          );
        }

        // Return updated settings
        const [updated] = await pool.execute(
          `SELECT id, clientId, enabled, subject, message, pickupInstructions,
                  smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from,
                  company_phone, company_website, created_at, updated_at
           FROM client_email_settings WHERE clientId = ? LIMIT 1`,
          [clientId]
        );
        const row = (updated as any[])[0];
        if (!row) return defaultSettings();
        return mapRowToSettings(row);
      } catch (err: any) {
        console.error(`[EmailSettings] Error:`, err.message);
        throw new Error(`Database error: ${err.message}`);
      }
    }),

  testSmtp: clientAuthedQuery
    .input(
      z.object({
        emailProvider: z.enum(["sendgrid", "resend"]),
        sendgridApiKey: z.string().optional().nullable(),
        resendApiKey: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.emailProvider === "sendgrid") {
        if (!input.sendgridApiKey) return { success: false, message: "SendGrid API key is required" };
        return testSendgrid(input.sendgridApiKey);
      }
      if (!input.resendApiKey) return { success: false, message: "Resend API key is required" };
      return testResend(input.resendApiKey);
    }),
});
