import { z } from "zod";
import { eq, and, gte, lte, sql, count, sum } from "drizzle-orm";
import { createRouter, clientAuthedQuery } from "./middleware";
import { getDb, getRawDb } from "./queries/connection";
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
      const rawDb = getRawDb();

      let sqlStr = `
        SELECT 
          b.zone_id as zoneId,
          COALESCE(z.name, 'Unknown Zone') as zoneName,
          b.vehicle_id as vehicleId,
          COALESCE(v.name, 'Unknown Vehicle') as vehicleName,
          COUNT(*) as totalBookings,
          COALESCE(SUM(b.total), 0) as totalRevenue
        FROM bookings b
        LEFT JOIN zones z ON b.zone_id = z.id
        LEFT JOIN vehicles v ON b.vehicle_id = v.id
        WHERE b.client_id = ?
      `;
      const params: any[] = [clientId];

      if (input?.startDate) {
        sqlStr += " AND b.date >= ?";
        params.push(input.startDate);
      }
      if (input?.endDate) {
        sqlStr += " AND b.date <= ?";
        params.push(input.endDate);
      }

      sqlStr += " GROUP BY b.zone_id, b.vehicle_id ORDER BY totalBookings DESC";

      const [rows] = await rawDb.query(sqlStr, params);

      return (rows as any[]).map((r) => ({
        zoneId: r.zoneId,
        zoneName: r.zoneName,
        vehicleId: r.vehicleId,
        vehicleName: r.vehicleName,
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
      const rawDb = getRawDb();

      let sqlStr = `
        SELECT 
          b.trip_type as tripType,
          b.zone_id as zoneId,
          COALESCE(z.name, 'Unknown Zone') as zoneName,
          b.vehicle_id as vehicleId,
          COALESCE(v.name, 'Unknown Vehicle') as vehicleName,
          COUNT(*) as totalBookings,
          COALESCE(SUM(b.total), 0) as totalRevenue
        FROM bookings b
        LEFT JOIN zones z ON b.zone_id = z.id
        LEFT JOIN vehicles v ON b.vehicle_id = v.id
        WHERE b.client_id = ?
      `;
      const params: any[] = [clientId];

      if (input?.startDate) {
        sqlStr += " AND b.date >= ?";
        params.push(input.startDate);
      }
      if (input?.endDate) {
        sqlStr += " AND b.date <= ?";
        params.push(input.endDate);
      }

      sqlStr += " GROUP BY b.trip_type, b.zone_id, b.vehicle_id ORDER BY totalBookings DESC";

      const [rows] = await rawDb.query(sqlStr, params);

      return (rows as any[]).map((r) => ({
        tripType: r.tripType,
        zoneId: r.zoneId,
        zoneName: r.zoneName,
        vehicleId: r.vehicleId,
        vehicleName: r.vehicleName,
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
      const rawDb = getRawDb();

      let sqlStr = `
        SELECT 
          COUNT(*) as totalBookings,
          COALESCE(SUM(total), 0) as totalRevenue,
          SUM(CASE WHEN trip_type = 'one_way' THEN 1 ELSE 0 END) as oneWayCount,
          SUM(CASE WHEN trip_type = 'round_trip' THEN 1 ELSE 0 END) as roundTripCount
        FROM bookings
        WHERE client_id = ?
      `;
      const params: any[] = [clientId];

      if (input?.startDate) {
        sqlStr += " AND date >= ?";
        params.push(input.startDate);
      }
      if (input?.endDate) {
        sqlStr += " AND date <= ?";
        params.push(input.endDate);
      }

      const [rows] = await rawDb.query(sqlStr, params);
      const result = (rows as any[])[0];

      return {
        totalBookings: Number(result?.totalBookings || 0),
        totalRevenue: Number(result?.totalRevenue || 0),
        oneWayCount: Number(result?.oneWayCount || 0),
        roundTripCount: Number(result?.roundTripCount || 0),
      };
    }),
});
