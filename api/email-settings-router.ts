import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, clientAuthedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { clientEmailSettings } from "@db/schema";

export const emailSettingsRouter = createRouter({
  get: clientAuthedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const clientId = ctx.clientUser.clientId;
    const existing = await db.query.clientEmailSettings.findFirst({
      where: eq(clientEmailSettings.clientId, clientId),
    });
    if (existing) return existing;
    // Auto-create default settings
    await db.insert(clientEmailSettings).values({
      clientId,
      enabled: true,
      subject: "Your Reservation Confirmation",
      message: "Thank you for your reservation. We look forward to serving you.",
      pickupInstructions: "",
      emailProvider: "sendgrid",
    });
    return db.query.clientEmailSettings.findFirst({
      where: eq(clientEmailSettings.clientId, clientId),
    });
  }),

  update: clientAuthedQuery
    .input(
      z.object({
        enabled: z.boolean().optional(),
        subject: z.string().max(255).optional(),
        message: z.string().optional(),
        pickupInstructions: z.string().optional(),
        emailProvider: z.enum(["smtp", "sendgrid", "resend"]).optional(),
        smtpHost: z.string().max(255).nullable().optional(),
        smtpPort: z.number().nullable().optional(),
        smtpUser: z.string().max(255).nullable().optional(),
        smtpPass: z.string().max(255).nullable().optional(),
        smtpFrom: z.string().max(320).nullable().optional(),
        sendgridApiKey: z.string().max(255).nullable().optional(),
        resendApiKey: z.string().max(255).nullable().optional(),
        companyPhone: z.string().max(50).nullable().optional(),
        companyWebsite: z.string().max(255).nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const clientId = ctx.clientUser.clientId;
      const existing = await db.query.clientEmailSettings.findFirst({
        where: eq(clientEmailSettings.clientId, clientId),
      });
      if (!existing) {
        await db.insert(clientEmailSettings).values({
          clientId,
          ...input,
        } as any);
      } else {
        await db
          .update(clientEmailSettings)
          .set(input as any)
          .where(eq(clientEmailSettings.clientId, clientId));
      }
      return db.query.clientEmailSettings.findFirst({
        where: eq(clientEmailSettings.clientId, clientId),
      });
    }),

  test: clientAuthedQuery
    .input(
      z.object({
        to: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: implement actual test email sending
      return { success: true, message: "Test email endpoint ready" };
    }),
});
