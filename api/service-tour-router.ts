import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { createRouter, clientAuthedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { serviceTours } from "@db/schema";

export const serviceTourRouter = createRouter({
  listMine: clientAuthedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.serviceTours.findMany({
      where: eq(serviceTours.clientId, ctx.clientUser.clientId),
      orderBy: [asc(serviceTours.sortOrder)],
    });
  }),

  list: publicQuery
    .input(z.object({ clientId: z.number().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.serviceTours.findMany({
        where: eq(serviceTours.clientId, input.clientId),
        orderBy: [asc(serviceTours.sortOrder)],
      });
    }),

  create: clientAuthedQuery
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      duration: z.string().optional(),
      highlights: z.string().optional(),
      price: z.string().regex(/^\d+(\.\d{2})?$/).default("0.00"),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [{ id }] = await db.insert(serviceTours).values({
        clientId: ctx.clientUser.clientId,
        ...input,
        active: true,
      }).$returningId();
      return db.query.serviceTours.findFirst({ where: eq(serviceTours.id, id) });
    }),

  update: clientAuthedQuery
    .input(z.object({
      id: z.number().positive(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      duration: z.string().optional(),
      highlights: z.string().optional(),
      price: z.string().regex(/^\d+(\.\d{2})?$/).optional(),
      active: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(serviceTours).set(data).where(eq(serviceTours.id, id));
      return db.query.serviceTours.findFirst({ where: eq(serviceTours.id, id) });
    }),

  delete: clientAuthedQuery
    .input(z.object({ id: z.number().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(serviceTours).where(eq(serviceTours.id, input.id));
      return { success: true };
    }),
});
