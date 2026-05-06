import { z } from "zod";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { bookings } from "@db/schema";

export const bookingRouter = createRouter({
  list: publicQuery
    .input(z.object({
      clientId: z.number().positive().optional(),
      status: z.enum(["confirmed", "pending", "cancelled"]).optional(),
      dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];

      if (input?.clientId) filters.push(eq(bookings.clientId, input.clientId));
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

  updateStatus: publicQuery
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

  stats: publicQuery.query(async () => {
    const db = getDb();

    const [confirmedResult] = await db
      .select({ count: count(), total: sql`COALESCE(SUM(${bookings.total}), 0)` })
      .from(bookings)
      .where(eq(bookings.status, "confirmed"));

    const [pendingResult] = await db
      .select({ count: count() })
      .from(bookings)
      .where(eq(bookings.status, "pending"));

    const [cancelledResult] = await db
      .select({ count: count() })
      .from(bookings)
      .where(eq(bookings.status, "cancelled"));

    const [todayResult] = await db
      .select({ count: count() })
      .from(bookings)
      .where(eq(bookings.date, new Date().toISOString().split("T")[0]));

    return {
      totalConfirmed: confirmedResult.count || 0,
      revenue: Number(confirmedResult.total) || 0,
      totalPending: pendingResult.count || 0,
      totalCancelled: cancelledResult.count || 0,
      todayCount: todayResult.count || 0,
    };
  }),
});
