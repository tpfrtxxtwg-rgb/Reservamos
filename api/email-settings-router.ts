import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, clientAuthedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { clientEmailSettings } from "@db/schema";

export const emailSettingsRouter = createRouter({
  get: clientAuthedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const clientId = ctx.clientUser.clientId;
    const settings = await db.query.clientEmailSettings.findFirst({
      where: eq(clientEmailSettings.clientId, clientId),
    });
    if (!settings) {
      // Return default settings without inserting
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
        smtpHost: z.string().max(255).optional().nullable(),
        smtpPort: z.number().min(1).max(65535).optional().nullable(),
        smtpUser: z.string().max(255).optional().nullable(),
        smtpPass: z.string().max(255).optional().nullable(),
        smtpFrom: z.string().email().max(320).optional().nullable(),
        companyPhone: z.string().max(50).optional().nullable(),
        companyWebsite: z.string().max(255).optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const clientId = ctx.clientUser.clientId;

      const existing = await db.query.clientEmailSettings.findFirst({
        where: eq(clientEmailSettings.clientId, clientId),
      });

      if (existing) {
        await db
          .update(clientEmailSettings)
          .set(input)
          .where(eq(clientEmailSettings.clientId, clientId));
        return db.query.clientEmailSettings.findFirst({
          where: eq(clientEmailSettings.clientId, clientId),
        });
      } else {
        const [{ id }] = await db
          .insert(clientEmailSettings)
          .values({ ...input, clientId })
          .$returningId();
        return db.query.clientEmailSettings.findFirst({
          where: eq(clientEmailSettings.id, id),
        });
      }
    }),
});
