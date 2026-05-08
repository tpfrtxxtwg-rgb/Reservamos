import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { createRouter, clientAuthedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { serviceAirports } from "@db/schema";

export const serviceAirportRouter = createRouter({
  listMine: clientAuthedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.serviceAirports.findMany({
      where: eq(serviceAirports.clientId, ctx.clientUser.clientId),
      orderBy: [asc(serviceAirports.sortOrder)],
    });
  }),

  list: publicQuery
    .input(z.object({ clientId: z.number().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.serviceAirports.findMany({
        where: eq(serviceAirports.clientId, input.clientId),
        orderBy: [asc(serviceAirports.sortOrder)],
      });
    }),

  create: clientAuthedQuery
    .input(z.object({
      name: z.string().min(1).max(255),
      code: z.string().min(1).max(10),
      city: z.string().optional(),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [{ id }] = await db.insert(serviceAirports).values({
        clientId: ctx.clientUser.clientId,
        ...input,
        active: true,
      }).$returningId();
      return db.query.serviceAirports.findFirst({ where: eq(serviceAirports.id, id) });
    }),

  update: clientAuthedQuery
    .input(z.object({
      id: z.number().positive(),
      name: z.string().min(1).max(255).optional(),
      code: z.string().min(1).max(10).optional(),
      city: z.string().optional(),
      active: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(serviceAirports).set(data).where(eq(serviceAirports.id, id));
      return db.query.serviceAirports.findFirst({ where: eq(serviceAirports.id, id) });
    }),

  delete: clientAuthedQuery
    .input(z.object({ id: z.number().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(serviceAirports).where(eq(serviceAirports.id, input.id));
      return { success: true };
    }),
});
