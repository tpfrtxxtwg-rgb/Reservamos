import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, clientAuthedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { clients } from "@db/schema";

export const companyProfileRouter = createRouter({
  get: clientAuthedQuery.query(async ({ ctx }) => {
    const clientId = ctx.clientUser.clientId;
    const result = await getDb()
      .select({
        id: clients.id,
        name: clients.name,
        email: clients.email,
        website: clients.website,
        phone: clients.phone,
        description: clients.description,
        domain: clients.domain,
        logoUrl: clients.logoUrl,
        primaryColor: clients.primaryColor,
        plan: clients.plan,
        status: clients.status,
        apiKey: clients.apiKey,
      })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);
    return result[0] || null;
  }),

  update: clientAuthedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
        email: z.string().email().max(320).optional(),
        website: z.string().max(255).nullable().optional(),
        phone: z.string().max(50).nullable().optional(),
        description: z.string().nullable().optional(),
        domain: z.string().max(255).nullable().optional(),
        logoUrl: z.string().nullable().optional(),
        primaryColor: z.string().max(7).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const clientId = ctx.clientUser.clientId;
      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.email !== undefined) updateData.email = input.email;
      if (input.website !== undefined) updateData.website = input.website;
      if (input.phone !== undefined) updateData.phone = input.phone;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.domain !== undefined) updateData.domain = input.domain;
      if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl;
      if (input.primaryColor !== undefined) updateData.primaryColor = input.primaryColor;

      await getDb()
        .update(clients)
        .set(updateData)
        .where(eq(clients.id, clientId));
      return { success: true };
    }),
});
