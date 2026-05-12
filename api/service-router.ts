import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, publicQuery, clientAuthedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { services } from "@db/schema";

export const serviceRouter = createRouter({
  // Public: used by widget
  list: publicQuery
    .input(z.object({ clientId: z.number().positive() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const clientId = input?.clientId || 1;
      return db.query.services.findMany({
        where: eq(services.clientId, clientId),
        orderBy: [desc(services.active), services.sortOrder],
      });
    }),

  // Admin: authenticated
  listMine: clientAuthedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.services.findMany({
      where: eq(services.clientId, ctx.clientUser.clientId),
      orderBy: [desc(services.active), services.sortOrder],
    });
  }),

  create: clientAuthedQuery
    .input(z.object({
      name: z.string().min(1).max(255),
      slug: z.string().min(1).max(100),
      icon: z.string().max(50).default("MapPin"),
      description: z.string().optional(),
      basePrice: z.string().regex(/^\d+(\.\d{2})?$/).default("0.00"),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [{ id }] = await db.insert(services).values({
        clientId: ctx.clientUser.clientId,
        ...input,
        active: true,
      }).$returningId();
      return db.query.services.findFirst({ where: eq(services.id, id) });
    }),

  update: clientAuthedQuery
    .input(z.object({
      id: z.number().positive(),
      name: z.string().min(1).max(255).optional(),
      icon: z.string().max(50).optional(),
      description: z.string().optional(),
      basePrice: z.string().regex(/^\d+(\.\d{2})?$/).optional(),
      active: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(services).set(data).where(eq(services.id, id));
      return db.query.services.findFirst({ where: eq(services.id, id) });
    }),

  delete: clientAuthedQuery
    .input(z.object({ id: z.number().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(services).where(eq(services.id, input.id));
      return { success: true };
    }),
});
