import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { services } from "@db/schema";

export const serviceRouter = createRouter({
  list: publicQuery
    .input(z.object({ clientId: z.number().positive() }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const clientId = ctx.user.role === "admin" && input?.clientId
        ? input.clientId
        : 1; // fallback for demo
      return db.query.services.findMany({
        where: eq(services.clientId, clientId),
        orderBy: [desc(services.active), services.sortOrder],
      });
    }),

  create: publicQuery
    .input(z.object({
      clientId: z.number().positive(),
      name: z.string().min(1).max(255),
      slug: z.string().min(1).max(100),
      icon: z.string().max(50).default("MapPin"),
      description: z.string().optional(),
      basePrice: z.string().regex(/^\d+(\.\d{2})?$/).default("0.00"),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [{ id }] = await db.insert(services).values({
        ...input,
        active: true,
      }).$returningId();
      return db.query.services.findFirst({ where: eq(services.id, id) });
    }),

  update: publicQuery
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

  delete: publicQuery
    .input(z.object({ id: z.number().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(services).where(eq(services.id, input.id));
      return { success: true };
    }),
});
