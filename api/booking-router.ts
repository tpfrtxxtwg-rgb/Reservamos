import { z } from "zod";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { createRouter, publicQuery, clientAuthedQuery } from "./middleware";
import { getDb, getRawDb } from "./queries/connection";
import { bookings } from "@db/schema";

export const bookingRouter = createRouter({
  // Admin: list bookings for authenticated client
  list: clientAuthedQuery
    .input(z.object({
      status: z.enum(["confirmed", "pending", "cancelled"]).optional(),
      dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const clientId = ctx.clientUser.clientId;
      const filters = [eq(bookings.clientId, clientId)];

      if (input?.status) filters.push(eq(bookings.status, input.status));
      if (input?.dateFrom) filters.push(eq(bookings.date, input.dateFrom));

      const whereClause = filters.length > 0 ? and(...filters) : undefined;

      const items = await db.query.bookings.findMany({
        where: whereClause,
        with: {
          service: true,
          vehicle: true,
          client: { columns: { id: true, name: true } },
        },
        orderBy: desc(bookings.createdAt),
        limit: input?.limit || 50,
        offset: input?.offset || 0,
      });

      const totalResult = await db
        .select({ count: count() })
        .from(bookings)
        .where(whereClause);

      return {
        items,
        total: totalResult[0]?.count || 0,
      };
    }),

  // Public: lookup by ID
  byId: publicQuery
    .input(z.object({ id: z.number().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.bookings.findFirst({
        where: eq(bookings.id, input.id),
        with: {
          service: true,
          vehicle: true,
          client: true,
        },
      });
    }),

  // Public: lookup by reservation code
  byCode: publicQuery
    .input(z.object({ code: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.bookings.findFirst({
        where: eq(bookings.code, input.code),
        with: {
          service: true,
          vehicle: true,
          client: true,
        },
      });
    }),

  // Admin: update status
  updateStatus: clientAuthedQuery
    .input(z.object({
      id: z.number().positive(),
      status: z.enum(["confirmed", "pending", "cancelled"]),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(bookings)
        .set({ status: input.status })
        .where(eq(bookings.id, input.id));
      return db.query.bookings.findFirst({
        where: eq(bookings.id, input.id),
        with: { service: true, vehicle: true },
      });
    }),

  // Admin: stats for authenticated client
  stats: clientAuthedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const clientId = ctx.clientUser.clientId;

    const [confirmedResult] = await db
      .select({ count: count(), total: sql`COALESCE(SUM(${bookings.total}), 0)` })
      .from(bookings)
      .where(and(eq(bookings.clientId, clientId), eq(bookings.status, "confirmed")));

    const [pendingResult] = await db
      .select({ count: count() })
      .from(bookings)
      .where(and(eq(bookings.clientId, clientId), eq(bookings.status, "pending")));

    const [cancelledResult] = await db
      .select({ count: count() })
      .from(bookings)
      .where(and(eq(bookings.clientId, clientId), eq(bookings.status, "cancelled")));

    const [todayResult] = await db
      .select({ count: count() })
      .from(bookings)
      .where(and(eq(bookings.clientId, clientId), eq(bookings.date, new Date().toISOString().split("T")[0])));

    return {
      totalConfirmed: confirmedResult.count || 0,
      revenue: Number(confirmedResult.total) || 0,
      totalPending: pendingResult.count || 0,
      totalCancelled: cancelledResult.count || 0,
      todayCount: todayResult.count || 0,
    };
  }),

  // Admin: clear all bookings for authenticated client (test data cleanup)
  clearAll: clientAuthedQuery
    .mutation(async ({ ctx }) => {
      const clientId = ctx.clientUser.clientId;
      const rawDb = getRawDb();
      const [result] = await rawDb.query(
        "DELETE FROM bookings WHERE clientId = ?",
        [clientId]
      );
      return { deleted: Number((result as any)?.affectedRows || 0) };
    }),
});
