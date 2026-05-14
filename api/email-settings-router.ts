import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, clientAuthedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { clientEmailSettings } from "@db/schema";

async function testSmtpConnection(settings: {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string | null;
}) {
  try {
    const nodemailerMod = await import("nodemailer");
    const nodemailer = nodemailerMod.default || nodemailerMod;
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort || 587,
      secure: (settings.smtpPort || 587) === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
    });
    await transporter.verify();
    return { success: true, message: "SMTP connection successful" };
  } catch (err: any) {
    return { success: false, message: err.message || "SMTP connection failed" };
  }
}

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
      // 403 means key works but doesn't have that endpoint permission
      return { success: true, message: "Resend API key is valid" };
    }
    return { success: false, message: `Resend API error: ${response.status}` };
  } catch (err: any) {
    return { success: false, message: err.message || "Resend connection failed" };
  }
}

export const emailSettingsRouter = createRouter({
  get: clientAuthedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const clientId = ctx.clientUser.clientId;
    const settings = await db.query.clientEmailSettings.findFirst({
      where: eq(clientEmailSettings.clientId, clientId),
    });
    if (!settings) {
      return {
        enabled: true,
        subject: "Your Reservation Confirmation",
        message: "Thank you for your reservation. We look forward to serving you.",
        pickupInstructions: "",
        emailProvider: "smtp" as const,
        smtpHost: "",
        smtpPort: 587,
        smtpUser: "",
        smtpPass: "",
        smtpFrom: "",
        sendgridApiKey: "",
        resendApiKey: "",
        companyPhone: "",
        companyWebsite: "",
      };
    }
    return settings;
  }),

  update: clientAuthedQuery
    .input(
      z.object({
        enabled: z.boolean().optional(),
        subject: z.string().max(255).optional(),
        message: z.string().optional(),
        pickupInstructions: z.string().optional(),
        emailProvider: z.enum(["smtp", "sendgrid", "resend"]).optional(),
        smtpHost: z.string().max(255).optional().nullable(),
        smtpPort: z.number().min(1).max(65535).optional().nullable(),
        smtpUser: z.string().max(255).optional().nullable(),
        smtpPass: z.string().max(255).optional().nullable(),
        smtpFrom: z.string().email().max(320).optional().nullable(),
        sendgridApiKey: z.string().max(255).optional().nullable(),
        resendApiKey: z.string().max(255).optional().nullable(),
        companyPhone: z.string().max(50).optional().nullable(),
        companyWebsite: z.string().max(255).optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = getDb();
        const clientId = ctx.clientUser.clientId;
        console.log(`[EmailSettings] Saving for clientId=${clientId}`, JSON.stringify(input));

        const existing = await db.query.clientEmailSettings.findFirst({
          where: eq(clientEmailSettings.clientId, clientId),
        });
        console.log(`[EmailSettings] Existing record:`, !!existing);

        if (existing) {
          await db
            .update(clientEmailSettings)
            .set(input)
            .where(eq(clientEmailSettings.clientId, clientId));
          const result = await db.query.clientEmailSettings.findFirst({
            where: eq(clientEmailSettings.clientId, clientId),
          });
          console.log(`[EmailSettings] Updated successfully`);
          return result;
        } else {
          console.log(`[EmailSettings] Inserting new record for clientId=${clientId}`);
          const [{ id }] = await db
            .insert(clientEmailSettings)
            .values({ ...input, clientId })
            .$returningId();
          const result = await db.query.clientEmailSettings.findFirst({
            where: eq(clientEmailSettings.id, id),
          });
          console.log(`[EmailSettings] Inserted successfully, id=${id}`);
          return result;
        }
      } catch (err: any) {
        console.error(`[EmailSettings] Database error:`, err.message, err.code);
        throw new Error(`Database error: ${err.message}`);
      }
    }),

  testSmtp: clientAuthedQuery
    .input(
      z.object({
        emailProvider: z.enum(["smtp", "sendgrid", "resend"]),
        smtpHost: z.string().optional().nullable(),
        smtpPort: z.number().optional().nullable(),
        smtpUser: z.string().optional().nullable(),
        smtpPass: z.string().optional().nullable(),
        sendgridApiKey: z.string().optional().nullable(),
        resendApiKey: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const { emailProvider } = input;

      if (emailProvider === "sendgrid") {
        if (!input.sendgridApiKey) return { success: false, message: "SendGrid API key is required" };
        return testSendgrid(input.sendgridApiKey);
      }

      if (emailProvider === "resend") {
        if (!input.resendApiKey) return { success: false, message: "Resend API key is required" };
        return testResend(input.resendApiKey);
      }

      // Default: SMTP
      if (!input.smtpHost || !input.smtpUser || !input.smtpPass) {
        return { success: false, message: "SMTP host, user, and password are required" };
      }
      return testSmtpConnection({
        smtpHost: input.smtpHost,
        smtpPort: input.smtpPort || 587,
        smtpUser: input.smtpUser,
        smtpPass: input.smtpPass,
        smtpFrom: null,
      });
    }),
});
