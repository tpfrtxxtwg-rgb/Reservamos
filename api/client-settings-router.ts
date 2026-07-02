import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, clientAuthedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { clients } from "@db/schema";

export const clientSettingsRouter = createRouter({
  get: clientAuthedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const clientId = ctx.clientUser.clientId;
    // Use raw SQL to avoid Drizzle schema validation issues during migration
    const result = await db.execute(
      `SELECT id, name, email, api_key, theme, primary_color, tax_rate, deposit_enabled, deposit_fixed_amount, deposit_percentage, plan, status FROM clients WHERE id = ?`,
      [clientId]
    );
    const rows = result as any[];
    if (!rows || rows.length === 0) throw new Error("Client not found");
    const row = rows[0];
    // Support both old (depositPercentage) and new (depositFixedAmount) columns
    const rawDepositFixed = row.deposit_fixed_amount ?? row.deposit_percentage;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      apiKey: row.api_key,
      theme: row.theme,
      primaryColor: row.primary_color,
      taxRate: row.tax_rate,
      depositEnabled: row.deposit_enabled,
      depositFixedAmount: rawDepositFixed ?? "50.00",
      plan: row.plan,
      status: row.status,
    };
  }),

  update: clientAuthedQuery
    .input(z.object({
      name: z.string().min(1).max(255).optional(),
      email: z.string().email().optional(),
      theme: z.enum(["light", "dark"]).optional(),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      taxRate: z.string().regex(/^\d+(\.\d{2})?$/).optional(),
      depositEnabled: z.boolean().optional(),
      depositFixedAmount: z.string().regex(/^\d+(\.\d{2})?$/).optional(),
      status: z.enum(["active", "inactive", "suspended"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const clientId = ctx.clientUser.clientId;
      // During migration: save depositFixedAmount to both columns for compatibility
      const updateData: any = { ...input };
      if (input.depositFixedAmount !== undefined) {
        updateData.depositPercentage = input.depositFixedAmount;
      }
      await db.update(clients).set(updateData).where(eq(clients.id, clientId));
      return db.query.clients.findFirst({ where: eq(clients.id, clientId) });
    }),
});
