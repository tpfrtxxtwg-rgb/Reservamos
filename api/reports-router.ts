import { z } from "zod";
import { eq, and, gte, lte, sql, count, sum } from "drizzle-orm";
import { createRouter, clientAuthedQuery } from "./middleware";
import { getDb, getRawDb } from "./queries/connection";
import { bookings, zones, vehicles } from "@db/schema";

export const reportsRouter = createRouter({
  // Bookings by Zone and Vehicle - using raw query for TiDB column names
  byZoneVehicle: clientAuthedQuery
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const clientId = ctx.clientUser.clientId;
      const rawDb = getRawDb();

      try {
        // Try with clientId (camelCase - from Drizzle schema)
        const [rows] = await rawDb.query(
          `SELECT 
            b.zoneId as zoneId,
            COALESCE(z.name, 'Unknown Zone') as zoneName,
            b.vehicleId as vehicleId,
            COALESCE(v.name, 'Unknown Vehicle') as vehicleName,
            COUNT(*) as totalBookings,
            COALESCE(SUM(b.total), 0) as totalRevenue
          FROM bookings b
          LEFT JOIN zones z ON b.zoneId = z.id
          LEFT JOIN vehicles v ON b.vehicleId = v.id
          WHERE b.clientId = ?
          ${input?.startDate ? "AND b.date >= ?" : ""}
          ${input?.endDate ? "AND b.date <= ?" : ""}
          GROUP BY b.zoneId, b.vehicleId
          ORDER BY totalBookings DESC`,
          [
            clientId,
            ...(input?.startDate ? [input.startDate] : []),
            ...(input?.endDate ? [input.endDate] : []),
          ]
        );

        const result = (rows as any[]).map((r) => ({
          zoneId: r.zoneId,
          zoneName: r.zoneName,
          vehicleId: r.vehicleId,
          vehicleName: r.vehicleName,
          totalBookings: Number(r.totalBookings || 0),
          totalRevenue: Number(r.totalRevenue || 0),
        }));

        console.log("[Reports] byZoneVehicle:", result.length, "rows");
        return result;
      } catch (err: any) {
        console.error("[Reports] byZoneVehicle ERROR:", err?.message || String(err));
        return [];
      }
    }),

  // Bookings by Service Type - using raw query
  byServiceType: clientAuthedQuery
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const clientId = ctx.clientUser.clientId;
      const rawDb = getRawDb();

      try {
        const [rows] = await rawDb.query(
          `SELECT 
            b.tripType as tripType,
            b.zoneId as zoneId,
            COALESCE(z.name, 'Unknown Zone') as zoneName,
            b.vehicleId as vehicleId,
            COALESCE(v.name, 'Unknown Vehicle') as vehicleName,
            COUNT(*) as totalBookings,
            COALESCE(SUM(b.total), 0) as totalRevenue
          FROM bookings b
          LEFT JOIN zones z ON b.zoneId = z.id
          LEFT JOIN vehicles v ON b.vehicleId = v.id
          WHERE b.clientId = ?
          ${input?.startDate ? "AND b.date >= ?" : ""}
          ${input?.endDate ? "AND b.date <= ?" : ""}
          GROUP BY b.tripType, b.zoneId, b.vehicleId
          ORDER BY totalBookings DESC`,
          [
            clientId,
            ...(input?.startDate ? [input.startDate] : []),
            ...(input?.endDate ? [input.endDate] : []),
          ]
        );

        const result = (rows as any[]).map((r) => ({
          tripType: r.tripType,
          zoneId: r.zoneId,
          zoneName: r.zoneName,
          vehicleId: r.vehicleId,
          vehicleName: r.vehicleName,
          totalBookings: Number(r.totalBookings || 0),
          totalRevenue: Number(r.totalRevenue || 0),
        }));

        console.log("[Reports] byServiceType:", result.length, "rows");
        return result;
      } catch (err: any) {
        console.error("[Reports] byServiceType ERROR:", err?.message || String(err));
        return [];
      }
    }),

  // Summary stats - using Drizzle (this was working before)
  summary: clientAuthedQuery
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const clientId = ctx.clientUser.clientId;
      const db = getDb();

      try {
        const conditions = [eq(bookings.clientId, clientId)];
        if (input?.startDate) conditions.push(gte(bookings.date, input.startDate));
        if (input?.endDate) conditions.push(lte(bookings.date, input.endDate));

        const [result] = await db
          .select({
            totalBookings: count(),
            totalRevenue: sum(bookings.total),
            oneWayCount: sum(sql`CASE WHEN ${bookings.tripType} = 'one_way' THEN 1 ELSE 0 END`),
            roundTripCount: sum(sql`CASE WHEN ${bookings.tripType} = 'round_trip' THEN 1 ELSE 0 END`),
          })
          .from(bookings)
          .where(and(...conditions));

        console.log("[Reports] summary:", JSON.stringify(result));
        return {
          totalBookings: Number(result.totalBookings || 0),
          totalRevenue: Number(result.totalRevenue || 0),
          oneWayCount: Number(result.oneWayCount || 0),
          roundTripCount: Number(result.roundTripCount || 0),
        };
      } catch (err: any) {
        console.error("[Reports] summary ERROR:", err?.message || String(err));
        return { totalBookings: 0, totalRevenue: 0, oneWayCount: 0, roundTripCount: 0 };
      }
    }),
});
