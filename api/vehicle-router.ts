import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, publicQuery, clientAuthedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { vehicles } from "@db/schema";

export const vehicleRouter = createRouter({
  // Public: used by widget
  list: publicQuery
    .input(z.object({ clientId: z.number().positive() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const clientId = input?.clientId || 1;
      return db.query.vehicles.findMany({
        where: eq(vehicles.clientId, clientId),
        orderBy: [desc(vehicles.active), vehicles.sortOrder],
      });
    }),

  // Admin: authenticated
  listMine: clientAuthedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.vehicles.findMany({
      where: eq(vehicles.clientId, ctx.clientUser.clientId),
      orderBy: [desc(vehicles.active), vehicles.sortOrder],
    });
  }),

  create: clientAuthedQuery
    .input(z.object({
      name: z.string().min(1).max(255),
      image: z.string().optional(),
      capacityMin: z.number().min(1).default(1),
      capacityMax: z.number().min(1).default(6),
      features: z.array(z.string()).default([]),
      hourlyRate: z.string().regex(/^\d+(\.\d{2})?$/).default("0.00"),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [{ id }] = await db.insert(vehicles).values({
        clientId: ctx.clientUser.clientId,
        ...input,
        features: input.features,
        active: true,
      }).$returningId();
      return db.query.vehicles.findFirst({ where: eq(vehicles.id, id) });
    }),

  update: clientAuthedQuery
    .input(z.object({
      id: z.number().positive(),
      name: z.string().min(1).max(255).optional(),
      image: z.string().optional(),
      capacityMin: z.number().min(1).optional(),
      capacityMax: z.number().min(1).optional(),
      features: z.array(z.string()).optional(),
      hourlyRate: z.string().regex(/^\d+(\.\d{2})?$/).optional(),
      active: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(vehicles).set(data).where(eq(vehicles.id, id));
      return db.query.vehicles.findFirst({ where: eq(vehicles.id, id) });
    }),

  delete: clientAuthedQuery
    .input(z.object({ id: z.number().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(vehicles).where(eq(vehicles.id, input.id));
      return { success: true };
    }),
});
