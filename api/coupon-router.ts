import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { createRouter, clientAuthedQuery, publicQuery } from "./middleware";
import { getDb, getRawDb } from "./queries/connection";
import { coupons } from "@db/schema";

export const couponRouter = createRouter({
  // Admin: List all coupons
  list: clientAuthedQuery.query(async () => {
    const db = getDb();
    return db.select().from(coupons).orderBy(sql`${coupons.createdAt} DESC`);
  }),

  // Admin: Create coupon
  create: clientAuthedQuery
    .input(
      z.object({
        code: z.string().min(3).max(50),
        discountPercent: z.number().int().min(1).max(100),
        maxUses: z.number().int().min(1).default(1),
        description: z.string().max(255).optional(),
        validUntil: z.string().optional(), // ISO date string
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(coupons).values({
        code: input.code.toUpperCase(),
        discountPercent: input.discountPercent,
        maxUses: input.maxUses,
        description: input.description,
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
      });
      return { id: Number(result.insertId) };
    }),

  // Admin: Toggle active/inactive
  toggle: clientAuthedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const rawDb = getRawDb();
      await rawDb.execute(
        "UPDATE coupons SET active = NOT active WHERE id = ?",
        [input.id]
      );
      return { success: true };
    }),

  // Admin: Delete coupon
  delete: clientAuthedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(coupons).where(eq(coupons.id, input.id));
      return { success: true };
    }),

  // Public: Validate coupon (used during registration)
  validate: publicQuery
    .input(z.object({ code: z.string().min(1) }))
    .query(async ({ input }) => {
      const rawDb = getRawDb();
      const [rows] = await rawDb.execute(
        `SELECT id, code, discountPercent, maxUses, usesCount, active, validUntil 
         FROM coupons WHERE code = ? LIMIT 1`,
        [input.code.toUpperCase()]
      );
      const coupon = (rows as any[])[0];
      if (!coupon) return { valid: false, reason: "Coupon not found" };
      if (!coupon.active) return { valid: false, reason: "Coupon is inactive" };
      if (coupon.usesCount >= coupon.maxUses) return { valid: false, reason: "Coupon fully used" };
      if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
        return { valid: false, reason: "Coupon expired" };
      }
      return {
        valid: true,
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        finalAmount: Math.round(600 * (1 - coupon.discountPercent / 100) * 100) / 100,
      };
    }),

  // Internal: Increment use count (called after successful registration)
  useCoupon: publicQuery
    .input(z.object({ code: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const rawDb = getRawDb();
      await rawDb.execute(
        "UPDATE coupons SET usesCount = usesCount + 1 WHERE code = ?",
        [input.code.toUpperCase()]
      );
      return { success: true };
    }),
});
