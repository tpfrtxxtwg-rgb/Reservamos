import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { zones } from "@db/schema";

export const zoneRouter = createRouter({
  list: publicQuery
    .input(z.object({ clientId: z.number().positive() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const clientId = input?.clientId || 1;
      return db.query.zones.findMany({
        where: eq(zones.clientId, clientId),
        orderBy: [desc(zones.active), zones.sortOrder],
      });
    }),

  create: publicQuery
    .input(z.object({
      clientId: z.number().positive(),
      name: z.string().min(1).max(255),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [{ id }] = await db.insert(zones).values({
        ...input,
        active: true,
      }).$returningId();
      return db.query.zones.findFirst({ where: eq(zones.id, id) });
    }),

  update: publicQuery
    .input(z.object({
      id: z.number().positive(),
      name: z.string().min(1).max(255).optional(),
      active: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(zones).set(data).where(eq(zones.id, id));
      return db.query.zones.findFirst({ where: eq(zones.id, id) });
    }),

  delete: publicQuery
    .input(z.object({ id: z.number().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(zones).where(eq(zones.id, input.id));
      return { success: true };
    }),
});
