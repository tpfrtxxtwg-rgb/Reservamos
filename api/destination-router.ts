import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { destinations } from "@db/schema";

export const destinationRouter = createRouter({
  list: publicQuery
    .input(z.object({ clientId: z.number().positive() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const clientId = input?.clientId || 1;
      return db.query.destinations.findMany({
        where: eq(destinations.clientId, clientId),
        orderBy: [asc(destinations.name)],
        with: { zone: true },
      });
    }),

  create: publicQuery
    .input(z.object({
      clientId: z.number().positive(),
      zoneId: z.number().positive(),
      name: z.string().min(1).max(255),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [{ id }] = await db.insert(destinations).values({
        ...input,
        active: true,
      }).$returningId();
      return db.query.destinations.findFirst({ where: eq(destinations.id, id), with: { zone: true } });
    }),

  update: publicQuery
    .input(z.object({
      id: z.number().positive(),
      zoneId: z.number().positive().optional(),
      name: z.string().min(1).max(255).optional(),
      active: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(destinations).set(data).where(eq(destinations.id, id));
      return db.query.destinations.findFirst({ where: eq(destinations.id, id), with: { zone: true } });
    }),

  delete: publicQuery
    .input(z.object({ id: z.number().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(destinations).where(eq(destinations.id, input.id));
      return { success: true };
    }),

  // Bulk import - useful for adding multiple hotels at once
  bulkImport: publicQuery
    .input(z.object({
      clientId: z.number().positive(),
      zoneId: z.number().positive(),
      names: z.array(z.string().min(1)).min(1),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const values = input.names.map((name, i) => ({
        clientId: input.clientId,
        zoneId: input.zoneId,
        name,
        active: true,
        sortOrder: i,
      }));
      await db.insert(destinations).values(values);
      return { success: true, count: values.length };
    }),
});
