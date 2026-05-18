import { z } from "zod";
import { eq, and, gte, lte, sql, count, sum } from "drizzle-orm";
import { createRouter, clientAuthedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { bookings, zones, vehicles, destinations } from "@db/schema";

export const reportsRouter = createRouter({
  // Bookings by Zone and Vehicle
  byZoneVehicle: clientAuthedQuery
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const clientId = ctx.clientUser.clientId;
      const db = getDb();

      const conditions = [eq(bookings.clientId, clientId)];
      if (input?.startDate) conditions.push(gte(bookings.date, input.startDate));
      if (input?.endDate) conditions.push(lte(bookings.date, input.endDate));

      const rows = await db
        .select({
          zoneId: bookings.zoneId,
          zoneName: zones.name,
          vehicleId: bookings.vehicleId,
          vehicleName: vehicles.name,
          totalBookings: count(),
          totalRevenue: sum(bookings.total),
        })
        .from(bookings)
        .leftJoin(zones, eq(bookings.zoneId, zones.id))
        .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
        .where(and(...conditions))
        .groupBy(bookings.zoneId, bookings.vehicleId);

      return rows.map((r) => ({
        zoneId: r.zoneId,
        zoneName: r.zoneName || "Unknown Zone",
        vehicleId: r.vehicleId,
        vehicleName: r.vehicleName || "Unknown Vehicle",
        totalBookings: Number(r.totalBookings || 0),
        totalRevenue: Number(r.totalRevenue || 0),
      }));
    }),

  // Bookings by Service Type (one way / round trip) by Vehicle and Zone
  byServiceType: clientAuthedQuery
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const clientId = ctx.clientUser.clientId;
      const db = getDb();

      const conditions = [eq(bookings.clientId, clientId)];
      if (input?.startDate) conditions.push(gte(bookings.date, input.startDate));
      if (input?.endDate) conditions.push(lte(bookings.date, input.endDate));

      const rows = await db
        .select({
          tripType: bookings.tripType,
          zoneId: bookings.zoneId,
          zoneName: zones.name,
          vehicleId: bookings.vehicleId,
          vehicleName: vehicles.name,
          totalBookings: count(),
          totalRevenue: sum(bookings.total),
        })
        .from(bookings)
        .leftJoin(zones, eq(bookings.zoneId, zones.id))
        .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
        .where(and(...conditions))
        .groupBy(bookings.tripType, bookings.zoneId, bookings.vehicleId);

      return rows.map((r) => ({
        tripType: r.tripType,
        zoneId: r.zoneId,
        zoneName: r.zoneName || "Unknown Zone",
        vehicleId: r.vehicleId,
        vehicleName: r.vehicleName || "Unknown Vehicle",
        totalBookings: Number(r.totalBookings || 0),
        totalRevenue: Number(r.totalRevenue || 0),
      }));
    }),

  // Summary stats
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

      return {
        totalBookings: Number(result.totalBookings || 0),
        totalRevenue: Number(result.totalRevenue || 0),
        oneWayCount: Number(result.oneWayCount || 0),
        roundTripCount: Number(result.roundTripCount || 0),
      };
    }),
});
