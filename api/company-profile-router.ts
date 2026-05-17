import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, clientAuthedQuery } from "./middleware";
import { getDb, getRawDb } from "./queries/connection";
import { clients } from "@db/schema";

export const companyProfileRouter = createRouter({
  get: clientAuthedQuery.query(async ({ ctx }) => {
    try {
      const clientId = ctx.clientUser.clientId;
      console.log("[CompanyProfile] GET clientId:", clientId);
      const rawDb = getRawDb();
      const [rows] = await rawDb.query(
        "SELECT id, name, email, domain, logo_url as logoUrl, primary_color as primaryColor, plan, status, api_key as apiKey FROM clients WHERE id = ? LIMIT 1",
        [clientId]
      );
      const result = (rows as any[])[0] || null;
      console.log("[CompanyProfile] GET result:", result ? "found" : "null");
      return result;
    } catch (err: any) {
      console.error("[CompanyProfile] GET ERROR:", err?.message || String(err));
      throw err;
    }
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
      try {
        const clientId = ctx.clientUser.clientId;
        console.log("[CompanyProfile] UPDATE clientId:", clientId, "input:", JSON.stringify(input));
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
        console.log("[CompanyProfile] UPDATE success");
        return { success: true };
      } catch (err: any) {
        console.error("[CompanyProfile] UPDATE ERROR:", err?.message || String(err));
        throw err;
      }
    }),
});
