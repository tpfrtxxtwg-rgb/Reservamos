import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, clientAuthedQuery } from "./middleware";
import { getDb, getRawDb } from "./queries/connection";
import { clients } from "@db/schema";

export const clientSettingsRouter = createRouter({
  get: clientAuthedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const clientId = ctx.clientUser.clientId;
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, clientId),
    });
    if (!client) throw new Error("Client not found");

    // Read acceptedMethods from client_payment_settings (NOT clients table)
    const rawDb = getRawDb();
    let acceptedMethods = "all";
    try {
      const [rows] = await rawDb.execute(
        `SELECT accepted_methods FROM client_payment_settings WHERE clientId = ? LIMIT 1`,
        [clientId]
      );
      const result = (rows as any[])[0];
      if (result) {
        acceptedMethods = result.accepted_methods ?? "all";
      }
    } catch (err) {
      console.error("[ClientSettings] Error reading payment settings:", err);
    }

    return {
      id: client.id,
      name: client.name,
      email: client.email,
      apiKey: client.apiKey,
      theme: client.theme,
      primaryColor: client.primaryColor,
      taxRate: client.taxRate,
      depositEnabled: client.depositEnabled,
      depositPercentage: client.depositPercentage,
      acceptedMethods,
      plan: client.plan,
      status: client.status,
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
      depositPercentage: z.string().regex(/^\d+(\.\d{2})?$/).optional(),
      acceptedMethods: z.enum(["cash", "card", "paypal", "card_paypal", "all"]).optional(),
      status: z.enum(["active", "inactive", "suspended"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const clientId = ctx.clientUser.clientId;
      await db.update(clients).set(input).where(eq(clients.id, clientId));
      return db.query.clients.findFirst({ where: eq(clients.id, clientId) });
    }),
});
