import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { clients } from "@db/schema";

export const clientRouter = createRouter({
  list: adminQuery.query(async () => {
    const db = getDb();
    return db.query.clients.findMany({ orderBy: desc(clients.createdAt) });
  }),

  byId: adminQuery
    .input(z.object({ id: z.number().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.clients.findFirst({
        where: eq(clients.id, input.id),
      });
    }),

  create: adminQuery
    .input(z.object({
      name: z.string().min(1).max(255),
      email: z.string().email(),
      domain: z.string().max(255).optional(),
      plan: z.enum(["starter", "professional", "enterprise"]).default("starter"),
      theme: z.enum(["light", "dark"]).default("light"),
      primaryColor: z.string().max(7).default("#C75E3A"),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const apiKey = `rv_${Buffer.from(Math.random().toString()).toString("base64url").slice(0, 24)}`;
      const [{ id }] = await db.insert(clients).values({
        ...input,
        apiKey,
        status: "active",
      }).$returningId();
      return db.query.clients.findFirst({ where: eq(clients.id, id) });
    }),

  update: adminQuery
    .input(z.object({
      id: z.number().positive(),
      name: z.string().min(1).max(255).optional(),
      email: z.string().email().optional(),
      domain: z.string().max(255).optional(),
      plan: z.enum(["starter", "professional", "enterprise"]).optional(),
      status: z.enum(["active", "inactive", "suspended"]).optional(),
      theme: z.enum(["light", "dark"]).optional(),
      primaryColor: z.string().max(7).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(clients).set(data).where(eq(clients.id, id));
      return db.query.clients.findFirst({ where: eq(clients.id, id) });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(clients).where(eq(clients.id, input.id));
      return { success: true };
    }),
});
