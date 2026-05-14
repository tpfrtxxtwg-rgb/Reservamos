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

// Map DB row to frontend settings (detects provider from smtp_host)
function mapRowToSettings(row: any) {
  const smtpHost = row.smtp_host || "";
  const smtpUser = row.smtp_user || "";
  const smtpFrom = row.smtp_from || "";

  // Detect provider from smtp_host value
  let emailProvider = "smtp";
  let sendgridApiKey = "";
  let resendApiKey = "";
  let smtpHostValue = smtpHost;
  let smtpPortValue = row.smtp_port || 587;
  let smtpUserValue = smtpUser;
  let smtpPassValue = row.smtp_pass || "";

  if (smtpHost === "sendgrid") {
    emailProvider = "sendgrid";
    sendgridApiKey = smtpUser; // API key stored in smtp_user
    smtpHostValue = "";
  } else if (smtpHost === "resend") {
    emailProvider = "resend";
    resendApiKey = smtpUser; // API key stored in smtp_user
    smtpHostValue = "";
  }

  return {
    id: row.id,
    clientId: row.clientId,
    enabled: Boolean(row.enabled),
    subject: row.subject || "Your Reservation Confirmation",
    message: row.message || "Thank you for your reservation. We look forward to serving you.",
    pickupInstructions: row.pickupInstructions || "",
    smtpHost: smtpHostValue,
    smtpPort: smtpPortValue,
    smtpUser: smtpUserValue,
    smtpPass: smtpPassValue,
    smtpFrom: smtpFrom,
    companyPhone: row.company_phone || "",
    companyWebsite: row.company_website || "",
    emailProvider,
    sendgridApiKey,
    resendApiKey,
  };
}

function defaultSettings() {
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

export const emailSettingsRouter = createRouter({
  get: clientAuthedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const clientId = ctx.clientUser.clientId;
    try {
      // Use raw SQL with only columns that exist in the DB
      // This avoids Drizzle selecting columns from the schema that don't exist yet
      const rows = await db.execute(
        `SELECT id, clientId, enabled, subject, message, pickupInstructions,
                smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from,
                company_phone, company_website, created_at, updated_at
         FROM client_email_settings WHERE clientId = ? LIMIT 1`,
        [clientId]
      );

      const row = rows[0];
      if (!row) {
        return defaultSettings();
      }

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

      // Map virtual fields to DB columns based on provider
      // For SendGrid: smtp_host = "sendgrid", smtp_user = API key
      // For Resend: smtp_host = "resend", smtp_user = API key
      // For SMTP: normal mapping
      let smtpHost = input.smtpHost;
      let smtpUser = input.smtpUser;
      let smtpPass = input.smtpPass;
      let smtpPort = input.smtpPort;

      if (input.emailProvider === "sendgrid" && input.sendgridApiKey) {
        smtpHost = "sendgrid";
        smtpUser = input.sendgridApiKey;
        smtpPass = null; // not needed
        smtpPort = null; // not needed
      } else if (input.emailProvider === "resend" && input.resendApiKey) {
        smtpHost = "resend";
        smtpUser = input.resendApiKey;
        smtpPass = null; // not needed
        smtpPort = null; // not needed
      }

      // Only use columns that exist in the DB
      const dbInput = {
        enabled: input.enabled,
        subject: input.subject,
        message: input.message,
        pickupInstructions: input.pickupInstructions,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
        smtpFrom: input.smtpFrom,
        companyPhone: input.companyPhone,
        companyWebsite: input.companyWebsite,
      };

      try {
        // Check if record exists using raw SQL
        const existingRows = await db.execute(
          `SELECT id FROM client_email_settings WHERE clientId = ? LIMIT 1`,
          [clientId]
        );

        if (existingRows.length > 0) {
          // UPDATE
          const setParts: string[] = [];
          const values: any[] = [];
          for (const [key, value] of Object.entries(dbInput)) {
            if (value !== undefined) {
              setParts.push(`${key} = ?`);
              values.push(value);
            }
          }
          values.push(clientId);
          await db.execute(
            `UPDATE client_email_settings SET ${setParts.join(", ")} WHERE clientId = ?`,
            values
          );
        } else {
          // INSERT
          const columns = ["clientId", ...Object.keys(dbInput).filter(k => dbInput[k as keyof typeof dbInput] !== undefined)];
          const placeholders = columns.map(() => "?").join(", ");
          const values = [clientId, ...Object.values(dbInput).filter(v => v !== undefined)];
          await db.execute(
            `INSERT INTO client_email_settings (${columns.join(", ")}) VALUES (${placeholders})`,
            values
          );
        }

        // Return updated settings by re-reading from DB
      const updatedRows = await db.execute(
        `SELECT id, clientId, enabled, subject, message, pickupInstructions,
                smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from,
                company_phone, company_website, created_at, updated_at
         FROM client_email_settings WHERE clientId = ? LIMIT 1`,
        [clientId]
      );
      const updatedRow = updatedRows[0];
      if (!updatedRow) return defaultSettings();

      // Map columns back to virtual fields
      return mapRowToSettings(updatedRow);
      } catch (err: any) {
        console.error(`[EmailSettings] Error:`, err.message);
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
