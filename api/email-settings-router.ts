import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, clientAuthedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { clientEmailSettings } from "@db/schema";

// Helper to safely get column - handles missing columns gracefully
function safeColumn(row: any, columnName: string, fallback: any = null) {
  return row && columnName in row ? row[columnName] : fallback;
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

  // Detect provider from smtp_host value ("sendgrid" or "resend")
  const emailProvider = smtpHost === "resend" ? "resend" : "sendgrid";
  const sendgridApiKey = emailProvider === "sendgrid" ? smtpUser : "";
  const resendApiKey = emailProvider === "resend" ? smtpUser : "";

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
        emailProvider: z.enum(["sendgrid", "resend"]).optional(),
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

      // Map provider to DB columns
      // For SendGrid: smtp_host = "sendgrid", smtp_user = API key
      // For Resend: smtp_host = "resend", smtp_user = API key
      const isSendgrid = input.emailProvider === "sendgrid" || !input.emailProvider;
      const smtpHost = isSendgrid ? "sendgrid" : "resend";
      const smtpUser = isSendgrid ? input.sendgridApiKey : input.resendApiKey;

      // Only use columns that exist in the DB
      const dbInput = {
        enabled: input.enabled,
        subject: input.subject,
        message: input.message,
        pickupInstructions: input.pickupInstructions,
        smtpHost,
        smtpPort: null, // not used for API providers
        smtpUser,
        smtpPass: null, // not used for API providers
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
      // resend
      if (!input.resendApiKey) return { success: false, message: "Resend API key is required" };
      return testResend(input.resendApiKey);
    }),
});
