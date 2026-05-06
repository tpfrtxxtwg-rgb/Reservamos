import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { vehicles } from "@db/schema";

export const vehicleRouter = createRouter({
  list: authedQuery
    .input(z.object({ clientId: z.number().positive() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const clientId = input?.clientId || 1;
      return db.query.vehicles.findMany({
        where: eq(vehicles.clientId, clientId),
        orderBy: [desc(vehicles.active), vehicles.sortOrder],
      });
    }),

  create: authedQuery
    .input(z.object({
      clientId: z.number().positive(),
      name: z.string().min(1).max(255),
      image: z.string().optional(),
      capacityMin: z.number().min(1).default(1),
      capacityMax: z.number().min(1).default(6),
      features: z.array(z.string()).default([]),
      basePrice: z.string().regex(/^\d+(\.\d{2})?$/).default("0.00"),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [{ id }] = await db.insert(vehicles).values({
        ...input,
        features: input.features,
        active: true,
      }).$returningId();
      return db.query.vehicles.findFirst({ where: eq(vehicles.id, id) });
    }),

  update: authedQuery
    .input(z.object({
      id: z.number().positive(),
      name: z.string().min(1).max(255).optional(),
      image: z.string().optional(),
      capacityMin: z.number().min(1).optional(),
      capacityMax: z.number().min(1).optional(),
      features: z.array(z.string()).optional(),
      basePrice: z.string().regex(/^\d+(\.\d{2})?$/).optional(),
      active: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(vehicles).set(data).where(eq(vehicles.id, id));
      return db.query.vehicles.findFirst({ where: eq(vehicles.id, id) });
    }),

  delete: authedQuery
    .input(z.object({ id: z.number().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(vehicles).where(eq(vehicles.id, input.id));
      return { success: true };
    }),
});
