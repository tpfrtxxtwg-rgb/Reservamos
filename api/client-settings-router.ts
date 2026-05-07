import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { clients } from "@db/schema";

export const clientSettingsRouter = createRouter({
  get: publicQuery
    .input(z.object({ clientId: z.number().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const client = await db.query.clients.findFirst({
        where: eq(clients.id, input.clientId),
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

  update: publicQuery
    .input(z.object({
      clientId: z.number().positive(),
      name: z.string().min(1).max(255).optional(),
      email: z.string().email().optional(),
      theme: z.enum(["light", "dark"]).optional(),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      taxRate: z.string().regex(/^\d+(\.\d{2})?$/).optional(),
      depositEnabled: z.boolean().optional(),
      depositPercentage: z.string().regex(/^\d+(\.\d{2})?$/).optional(),
      status: z.enum(["active", "inactive", "suspended"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { clientId, ...data } = input;
      await db.update(clients).set(data).where(eq(clients.id, clientId));
      return db.query.clients.findFirst({ where: eq(clients.id, clientId) });
    }),
});
