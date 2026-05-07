import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { optionalServices } from "@db/schema";

export const optionalServiceRouter = createRouter({
  list: publicQuery
    .input(z.object({ clientId: z.number().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.optionalServices.findMany({
        where: and(
          eq(optionalServices.clientId, input.clientId),
          eq(optionalServices.active, true),
        ),
        orderBy: optionalServices.sortOrder,
      });
    }),

  create: publicQuery
    .input(z.object({
      clientId: z.number().positive(),
      name: z.string().min(1).max(255),
      slug: z.string().min(1).max(100),
      description: z.string().optional(),
      price: z.string().regex(/^\d+(\.\d{2})?$/).default("0.00"),
      perPassenger: z.boolean().default(false),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [{ id }] = await db.insert(optionalServices).values({
        ...input,
        active: true,
      }).$returningId();
      return db.query.optionalServices.findFirst({ where: eq(optionalServices.id, id) });
    }),

  update: publicQuery
    .input(z.object({
      id: z.number().positive(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      price: z.string().regex(/^\d+(\.\d{2})?$/).optional(),
      perPassenger: z.boolean().optional(),
      active: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(optionalServices).set(data).where(eq(optionalServices.id, id));
      return db.query.optionalServices.findFirst({ where: eq(optionalServices.id, id) });
    }),

  delete: publicQuery
    .input(z.object({ id: z.number().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(optionalServices).where(eq(optionalServices.id, input.id));
      return { success: true };
    }),
});
