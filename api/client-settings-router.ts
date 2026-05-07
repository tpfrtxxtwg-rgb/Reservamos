import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, clientAuthedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { clients } from "@db/schema";

export const clientSettingsRouter = createRouter({
  get: clientAuthedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const clientId = ctx.clientUser.clientId;
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, clientId),
    });
    if (!client) throw new Error("Client not found");
    return {
      id: client.id,
      name: client.name,
      email: client.email,
      theme: client.theme,
      primaryColor: client.primaryColor,
      taxRate: client.taxRate,
      depositEnabled: client.depositEnabled,
      depositPercentage: client.depositPercentage,
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
      status: z.enum(["active", "inactive", "suspended"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const clientId = ctx.clientUser.clientId;
      await db.update(clients).set(input).where(eq(clients.id, clientId));
      return db.query.clients.findFirst({ where: eq(clients.id, clientId) });
    }),
});
