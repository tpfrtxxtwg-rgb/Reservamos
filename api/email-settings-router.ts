import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, clientAuthedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { clientEmailSettings } from "@db/schema";

// Helper to safely get column - handles missing columns gracefully
function safeColumn(row: any, columnName: string, fallback: any = null) {
  return row && columnName in row ? row[columnName] : fallback;
}

async function testSmtpConnection(settings: {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
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
    try {
      const settings = await db.query.clientEmailSettings.findFirst({
        where: eq(clientEmailSettings.clientId, clientId),
      });
      if (!settings) {
        return {
          enabled: true,
          subject: "Your Reservation Confirmation",
          message: "Thank you for your reservation. We look forward to serving you.",
          pickupInstructions: "",
          smtpHost: "",
          smtpPort: 587,
          smtpUser: "",
          smtpPass: "",
          smtpFrom: "",
          companyPhone: "",
          companyWebsite: "",
          // These may not exist in DB yet - default to empty
          emailProvider: "smtp",
          sendgridApiKey: "",
          resendApiKey: "",
        };
      }
      // Return all fields, using safeColumn for potentially missing columns
      return {
        ...settings,
        emailProvider: safeColumn(settings, "email_provider", "smtp"),
        sendgridApiKey: safeColumn(settings, "sendgrid_api_key", ""),
        resendApiKey: safeColumn(settings, "resend_api_key", ""),
      };
    } catch (err: any) {
      console.error("[EmailSettings] get error:", err.message);
      // Return defaults on any error (missing table, missing columns, etc.)
      return {
        enabled: true,
        subject: "Your Reservation Confirmation",
        message: "Thank you for your reservation. We look forward to serving you.",
        pickupInstructions: "",
        smtpHost: "",
        smtpPort: 587,
        smtpUser: "",
        smtpPass: "",
        smtpFrom: "",
        companyPhone: "",
        companyWebsite: "",
        emailProvider: "smtp",
        sendgridApiKey: "",
        resendApiKey: "",
      };
    }
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
      const db = getDb();
      const clientId = ctx.clientUser.clientId;
      console.log(`[EmailSettings] Saving for clientId=${clientId}`);

      // Build update object with only columns that exist in DB
      const dbInput: any = {
        enabled: input.enabled,
        subject: input.subject,
        message: input.message,
        pickupInstructions: input.pickupInstructions,
        smtpHost: input.smtpHost,
        smtpPort: input.smtpPort,
        smtpUser: input.smtpUser,
        smtpPass: input.smtpPass,
        smtpFrom: input.smtpFrom,
        companyPhone: input.companyPhone,
        companyWebsite: input.companyWebsite,
      };

      // Only include new columns if they have values (may not exist in DB)
      if (input.emailProvider && input.emailProvider !== "smtp") {
        dbInput.emailProvider = input.emailProvider;
      }
      if (input.sendgridApiKey) {
        dbInput.sendgridApiKey = input.sendgridApiKey;
      }
      if (input.resendApiKey) {
        dbInput.resendApiKey = input.resendApiKey;
      }

      try {
        const existing = await db.query.clientEmailSettings.findFirst({
          where: eq(clientEmailSettings.clientId, clientId),
        });

        if (existing) {
          await db
            .update(clientEmailSettings)
            .set(dbInput)
            .where(eq(clientEmailSettings.clientId, clientId));
          return db.query.clientEmailSettings.findFirst({
            where: eq(clientEmailSettings.clientId, clientId),
          });
        } else {
          const [{ id }] = await db
            .insert(clientEmailSettings)
            .values({ ...dbInput, clientId })
            .$returningId();
          return db.query.clientEmailSettings.findFirst({
            where: eq(clientEmailSettings.id, id),
          });
        }
      } catch (err: any) {
        console.error(`[EmailSettings] Error:`, err.message);
        // If error is about missing columns, retry without new columns
        if (err.message?.includes("Unknown column")) {
          console.log("[EmailSettings] Retrying without new columns...");
          const basicInput: any = {
            enabled: input.enabled,
            subject: input.subject,
            message: input.message,
            pickupInstructions: input.pickupInstructions,
            smtpHost: input.smtpHost,
            smtpPort: input.smtpPort,
            smtpUser: input.smtpUser,
            smtpPass: input.smtpPass,
            smtpFrom: input.smtpFrom,
            companyPhone: input.companyPhone,
            companyWebsite: input.companyWebsite,
          };

          const existing = await db.query.clientEmailSettings.findFirst({
            where: eq(clientEmailSettings.clientId, clientId),
          });

          if (existing) {
            await db
              .update(clientEmailSettings)
              .set(basicInput)
              .where(eq(clientEmailSettings.clientId, clientId));
          } else {
            await db
              .insert(clientEmailSettings)
              .values({ ...basicInput, clientId })
              .$returningId();
          }
          return db.query.clientEmailSettings.findFirst({
            where: eq(clientEmailSettings.clientId, clientId),
          });
        }
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
      });
    }),
});
