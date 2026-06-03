import { z } from "zod";
import { createRouter, clientAuthedQuery } from "./middleware";
import { getRawDb } from "./queries/connection";

export const emailSettingsRouter = createRouter({
  get: clientAuthedQuery.query(async ({ ctx }) => {
    const clientId = ctx.clientUser.clientId;
    const rawDb = getRawDb();
    try {
      console.log(`[EmailSettings] GET for clientId=${clientId}`);
      const [rows] = await rawDb.execute(
        `SELECT enabled, subject, message, pickupInstructions,
          smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from,
          company_phone, company_website
         FROM client_email_settings WHERE clientId = ? LIMIT 1`,
        [clientId]
      );
      const result = (rows as any[])[0];
      console.log(`[EmailSettings] rows count=${(rows as any[]).length}, result=`, result);
      if (result) {
        const provider = result.smtp_host === "resend" ? "resend" : "sendgrid";
        console.log(`[EmailSettings] provider=${provider}, smtp_user=${result.smtp_user?.substring(0,10)}...`);
        return {
          enabled: result.enabled ?? true,
          subject: result.subject ?? "",
          message: result.message ?? "",
          pickupInstructions: result.pickupInstructions ?? "",
          emailProvider: provider,
          smtpHost: result.smtp_host ?? "",
          smtpPort: result.smtp_port ?? 587,
          smtpUser: result.smtp_user ?? "",
          smtpPass: result.smtp_pass ?? "",
          smtpFrom: result.smtp_from ?? "",
          sendgridApiKey: provider === "sendgrid" ? (result.smtp_user ?? "") : "",
          resendApiKey: provider === "resend" ? (result.smtp_user ?? "") : "",
          companyPhone: result.company_phone ?? "",
          companyWebsite: result.company_website ?? "",
        };
      }
      console.log("[EmailSettings] No record found, returning defaults");
    } catch (err: any) {
      console.error("[EmailSettings] GET error:", err?.message || String(err));
    }
    // Return defaults if no record or error
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

      try {
        // Map provider to smtp_host for compatibility with existing email-router.ts
        const smtpHost = input.emailProvider === "resend" ? "resend" : "sendgrid";
        // Store API key in smtp_user (legacy format used by email-router.ts)
        const smtpUser = input.emailProvider === "resend"
          ? (input.resendApiKey || "")
          : (input.sendgridApiKey || "");

        // Check if record exists
        const [existingRows] = await rawDb.execute(
          "SELECT id FROM client_email_settings WHERE clientId = ? LIMIT 1",
          [clientId]
        );

        if ((existingRows as any[]).length === 0) {
          // INSERT - only columns known to exist
          await rawDb.execute(
            `INSERT INTO client_email_settings
             (clientId, enabled, subject, message, pickupInstructions,
              smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from,
              company_phone, company_website)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [clientId,
             input.enabled ?? true,
             input.subject ?? "Your Reservation Confirmation",
             input.message ?? "Thank you for your reservation.",
             input.pickupInstructions ?? "",
             smtpHost, 587, smtpUser,
             input.smtpPass ?? "",
             input.smtpFrom ?? "",
             input.companyPhone ?? "",
             input.companyWebsite ?? ""]
          );
        } else {
          // UPDATE - only columns known to exist
          const sets: string[] = [];
          const values: any[] = [];

          if (input.enabled !== undefined) { sets.push("enabled = ?"); values.push(input.enabled); }
          if (input.subject !== undefined) { sets.push("subject = ?"); values.push(input.subject); }
          if (input.message !== undefined) { sets.push("message = ?"); values.push(input.message); }
          if (input.pickupInstructions !== undefined) { sets.push("pickupInstructions = ?"); values.push(input.pickupInstructions); }
          if (input.smtpFrom !== undefined) { sets.push("smtp_from = ?"); values.push(input.smtpFrom); }
          if (input.smtpPass !== undefined) { sets.push("smtp_pass = ?"); values.push(input.smtpPass); }
          if (input.companyPhone !== undefined) { sets.push("company_phone = ?"); values.push(input.companyPhone); }
          if (input.companyWebsite !== undefined) { sets.push("company_website = ?"); values.push(input.companyWebsite); }

          // Always sync the legacy fields
          sets.push("smtp_host = ?"); values.push(smtpHost);
          sets.push("smtp_user = ?"); values.push(smtpUser);

          values.push(clientId);
          await rawDb.execute(
            `UPDATE client_email_settings SET ${sets.join(", ")} WHERE clientId = ?`,
            values
          );
        }

        return { success: true };
      } catch (err: any) {
        console.error("[EmailSettings] UPDATE error:", err?.message || String(err));
        throw new Error("Failed to save email settings: " + (err?.message || String(err)));
      }
    }),

  test: clientAuthedQuery
    .input(z.object({ to: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const clientId = ctx.clientUser.clientId;
      const rawDb = getRawDb();
      try {
        const [rows] = await rawDb.execute(
          `SELECT smtp_host, smtp_user FROM client_email_settings WHERE clientId = ? LIMIT 1`,
          [clientId]
        );
        const result = (rows as any[])[0];
        if (!result || !result.smtp_user) {
          return { sent: false, reason: "API key not configured" };
        }
        const provider = result.smtp_host === "resend" ? "resend" : "sendgrid";
        return { sent: true, reason: `Connected to ${provider}` };
      } catch (err: any) {
        return { sent: false, reason: "Error: " + (err?.message || String(err)) };
      }
    }),
});
