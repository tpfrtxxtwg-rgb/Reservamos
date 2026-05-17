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
        "SELECT id, name, email, website, phone, description, domain, logoUrl, primaryColor, plan, status, apiKey FROM clients WHERE id = ? LIMIT 1",
        [clientId]
      );
      const result = (rows as any[])[0] || null;
      console.log("[CompanyProfile] GET result:", result ? JSON.stringify(result).substring(0,200) : "null");
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
        console.log("[CompanyProfile] UPDATE clientId:", clientId);
        const rawDb = getRawDb();

        // Build SET clause dynamically - only update fields that exist in TiDB
        const sets: string[] = [];
        const values: any[] = [];

        if (input.name !== undefined) { sets.push("name = ?"); values.push(input.name); }
        if (input.email !== undefined) { sets.push("email = ?"); values.push(input.email); }
        if (input.website !== undefined) { sets.push("website = ?"); values.push(input.website); }
        if (input.phone !== undefined) { sets.push("phone = ?"); values.push(input.phone); }
        if (input.description !== undefined) { sets.push("description = ?"); values.push(input.description); }
        if (input.domain !== undefined) { sets.push("domain = ?"); values.push(input.domain); }
        if (input.logoUrl !== undefined) { sets.push("logoUrl = ?"); values.push(input.logoUrl); }
        if (input.primaryColor !== undefined) { sets.push("primaryColor = ?"); values.push(input.primaryColor); }

        if (sets.length === 0) {
          return { success: true };
        }

        values.push(clientId);
        const sql = `UPDATE clients SET ${sets.join(", ")} WHERE id = ?`;
        console.log("[CompanyProfile] UPDATE sql:", sql);

        await rawDb.query(sql, values);
        console.log("[CompanyProfile] UPDATE success");
        return { success: true };
      } catch (err: any) {
        console.error("[CompanyProfile] UPDATE ERROR:", err?.message || String(err));
        throw err;
      }
    }),
});
