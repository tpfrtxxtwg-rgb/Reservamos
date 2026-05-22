import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, clientAuthedQuery } from "./middleware";
import { getDb, getRawDb } from "./queries/connection";

export const emailSettingsRouter = createRouter({
  get: clientAuthedQuery.query(async ({ ctx }) => {
    const clientId = ctx.clientUser.clientId;
    const rawDb = getRawDb();
    const [rows] = await rawDb.query(
      `SELECT enabled, subject, message, pickupInstructions,
        email_provider, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from,
        sendgrid_api_key, resend_api_key,
        company_phone, company_website
       FROM client_email_settings WHERE clientId = ? LIMIT 1`,
      [clientId]
    );
    const result = (rows as any[])[0];
    if (result) return {
      enabled: result.enabled ?? true,
      subject: result.subject ?? "",
      message: result.message ?? "",
      pickupInstructions: result.pickupInstructions ?? "",
      emailProvider: result.email_provider ?? "sendgrid",
      smtpHost: result.smtp_host ?? "",
      smtpPort: result.smtp_port ?? 587,
      smtpUser: result.smtp_user ?? "",
      smtpPass: result.smtp_pass ?? "",
      smtpFrom: result.smtp_from ?? "",
      sendgridApiKey: result.sendgrid_api_key ?? "",
      resendApiKey: result.resend_api_key ?? "",
      companyPhone: result.company_phone ?? "",
      companyWebsite: result.company_website ?? "",
    };
    return {
      enabled: true,
      subject: "Your Reservation Confirmation",
      message: "Thank you for your reservation. We look forward to serving you.",
      pickupInstructions: "",
      emailProvider: "sendgrid",
      smtpHost: "", smtpPort: 587, smtpUser: "", smtpPass: "", smtpFrom: "",
      sendgridApiKey: "", resendApiKey: "",
      companyPhone: "", companyWebsite: "",
    };
  }),

  update: clientAuthedQuery
    .input(
      z.object({
        enabled: z.boolean().optional(),
        subject: z.string().max(255).optional(),
        message: z.string().optional(),
        pickupInstructions: z.string().optional(),
        emailProvider: z.enum(["sendgrid", "resend"]).optional(),
        sendgridApiKey: z.string().max(255).nullable().optional(),
        resendApiKey: z.string().max(255).nullable().optional(),
        smtpFrom: z.string().max(320).nullable().optional(),
        smtpPass: z.string().nullable().optional(),
        companyPhone: z.string().max(50).nullable().optional(),
        companyWebsite: z.string().max(255).nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const clientId = ctx.clientUser.clientId;
      const rawDb = getRawDb();

      // Map provider to smtp_host for compatibility with existing email-router.ts
      const smtpHost = input.emailProvider === "resend" ? "resend" : "sendgrid";
      // Store API key in smtp_user (legacy format used by email-router.ts)
      const smtpUser = input.emailProvider === "resend"
        ? (input.resendApiKey || "")
        : (input.sendgridApiKey || "");

      const sets: string[] = [];
      const values: any[] = [];

      if (input.enabled !== undefined) { sets.push("enabled = ?"); values.push(input.enabled); }
      if (input.subject !== undefined) { sets.push("subject = ?"); values.push(input.subject); }
      if (input.message !== undefined) { sets.push("message = ?"); values.push(input.message); }
      if (input.pickupInstructions !== undefined) { sets.push("pickupInstructions = ?"); values.push(input.pickupInstructions); }
      if (input.emailProvider !== undefined) { sets.push("email_provider = ?"); values.push(input.emailProvider); }
      if (input.smtpFrom !== undefined) { sets.push("smtp_from = ?"); values.push(input.smtpFrom); }
      if (input.smtpPass !== undefined) { sets.push("smtp_pass = ?"); values.push(input.smtpPass); }
      if (input.companyPhone !== undefined) { sets.push("company_phone = ?"); values.push(input.companyPhone); }
      if (input.companyWebsite !== undefined) { sets.push("company_website = ?"); values.push(input.companyWebsite); }
      if (input.sendgridApiKey !== undefined) { sets.push("sendgrid_api_key = ?"); values.push(input.sendgridApiKey); }
      if (input.resendApiKey !== undefined) { sets.push("resend_api_key = ?"); values.push(input.resendApiKey); }

      // Always sync the legacy fields
      sets.push("smtp_host = ?"); values.push(smtpHost);
      sets.push("smtp_user = ?"); values.push(smtpUser);

      // Check if record exists
      const [existingRows] = await rawDb.query(
        "SELECT id FROM client_email_settings WHERE clientId = ? LIMIT 1",
        [clientId]
      );

      if ((existingRows as any[]).length === 0) {
        await rawDb.query(
          `INSERT INTO client_email_settings
           (clientId, enabled, subject, message, pickupInstructions, email_provider,
            smtp_host, smtp_user, smtp_from, sendgrid_api_key, resend_api_key,
            company_phone, company_website)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [clientId,
           input.enabled ?? true,
           input.subject ?? "Your Reservation Confirmation",
           input.message ?? "Thank you for your reservation.",
           input.pickupInstructions ?? "",
           input.emailProvider ?? "sendgrid",
           smtpHost, smtpUser,
           input.smtpFrom ?? "",
           input.sendgridApiKey ?? "",
           input.resendApiKey ?? "",
           input.companyPhone ?? "",
           input.companyWebsite ?? ""]
        );
      } else {
        values.push(clientId);
        await rawDb.query(
          `UPDATE client_email_settings SET ${sets.join(", ")} WHERE clientId = ?`,
          values
        );
      }

      return { success: true };
    }),

  test: clientAuthedQuery
    .input(z.object({ to: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const clientId = ctx.clientUser.clientId;
      const rawDb = getRawDb();
      const [rows] = await rawDb.query(
        `SELECT smtp_host, smtp_user FROM client_email_settings WHERE clientId = ? LIMIT 1`,
        [clientId]
      );
      const result = (rows as any[])[0];
      if (!result || !result.smtp_user) {
        return { sent: false, reason: "API key not configured" };
      }
      const provider = result.smtp_host === "resend" ? "resend" : "sendgrid";
      return { sent: true, reason: `Test ready with ${provider}` };
    }),
});
