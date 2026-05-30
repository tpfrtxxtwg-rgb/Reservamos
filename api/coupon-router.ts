import { z } from "zod";
import { createRouter, clientAuthedQuery, publicQuery } from "./middleware";
import { getRawDb } from "./queries/connection";

export const couponRouter = createRouter({
  list: clientAuthedQuery.query(async () => {
    const rawDb = getRawDb();
    const [rows] = await rawDb.execute(
      `SELECT id, code, discount_percent as discountPercent, max_uses as maxUses,
        uses_count as usesCount, active, description, valid_until as validUntil, created_at as createdAt
       FROM coupons ORDER BY created_at DESC LIMIT 100`
    );
    return rows as any[];
  }),

  create: clientAuthedQuery
    .input(z.object({
      code: z.string().min(3).max(50),
      discountPercent: z.number().int().min(1).max(100),
      maxUses: z.number().int().min(1).default(1),
      description: z.string().max(255).optional(),
      validUntil: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const rawDb = getRawDb();
      const [result] = await rawDb.execute(
        `INSERT INTO coupons (code, discount_percent, max_uses, valid_until) VALUES (?, ?, ?, ?)`,
        [input.code.toUpperCase(), input.discountPercent, input.maxUses, input.validUntil ? new Date(input.validUntil) : null]
      );
      return { id: Number((result as any).insertId) };
    }),

  toggle: clientAuthedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const rawDb = getRawDb();
      await rawDb.execute("UPDATE coupons SET active = IF(active = 1, 0, 1) WHERE id = ?", [input.id]);
      return { success: true };
    }),

  delete: clientAuthedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const rawDb = getRawDb();
      await rawDb.execute("DELETE FROM coupons WHERE id = ?", [input.id]);
      return { success: true };
    }),

  validate: publicQuery
    .input(z.object({ code: z.string().min(1) }))
    .query(async ({ input }) => {
      const rawDb = getRawDb();
      const [rows] = await rawDb.execute(
        `SELECT id, code, discount_percent as discountPercent, max_uses as maxUses,
          uses_count as usesCount, active, valid_until as validUntil
         FROM coupons WHERE code = ? LIMIT 1`, [input.code.toUpperCase()]
      );
      const coupon = (rows as any[])[0];
      if (!coupon) return { valid: false, reason: "Coupon not found" };
      if (!coupon.active) return { valid: false, reason: "Coupon is inactive" };
      if (coupon.usesCount >= coupon.maxUses) return { valid: false, reason: "Coupon fully used" };
      if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) return { valid: false, reason: "Coupon expired" };
      return { valid: true, code: coupon.code, discountPercent: coupon.discountPercent, finalAmount: Math.round(600 * (1 - coupon.discountPercent / 100) * 100) / 100 };
    }),

  useCoupon: publicQuery
    .input(z.object({ code: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const rawDb = getRawDb();
      await rawDb.execute("UPDATE coupons SET uses_count = uses_count + 1 WHERE code = ?", [input.code.toUpperCase()]);
      return { success: true };
    }),
});
