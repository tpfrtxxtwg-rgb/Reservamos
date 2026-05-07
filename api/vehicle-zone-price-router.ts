import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createRouter, publicQuery, clientAuthedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { vehicleZonePrices } from "@db/schema";

export const vehicleZonePriceRouter = createRouter({
  // Public: used by widget
  listByZone: publicQuery
    .input(z.object({ zoneId: z.number().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const prices = await db.query.vehicleZonePrices.findMany({
        where: and(
          eq(vehicleZonePrices.zoneId, input.zoneId),
          eq(vehicleZonePrices.active, true)
        ),
        with: { vehicle: true, zone: true },
      });
      return prices;
    }),

  listByVehicle: publicQuery
    .input(z.object({ vehicleId: z.number().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.vehicleZonePrices.findMany({
        where: and(
          eq(vehicleZonePrices.vehicleId, input.vehicleId),
          eq(vehicleZonePrices.active, true)
        ),
        with: { vehicle: true, zone: true },
      });
    }),

  // Admin: get all prices for authenticated client
  listMine: clientAuthedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.vehicleZonePrices.findMany({
      with: { vehicle: true, zone: true },
    });
  }),

  // Admin: authenticated
  upsert: clientAuthedQuery
    .input(z.object({
      zoneId: z.number().positive(),
      vehicleId: z.number().positive(),
      oneWayPrice: z.string().regex(/^\d+(\.\d{2})?$/).default("0.00"),
      roundTripPrice: z.string().regex(/^\d+(\.\d{2})?$/).default("0.00"),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db.query.vehicleZonePrices.findFirst({
        where: and(
          eq(vehicleZonePrices.zoneId, input.zoneId),
          eq(vehicleZonePrices.vehicleId, input.vehicleId)
        ),
      });

      if (existing) {
        await db.update(vehicleZonePrices)
          .set({
            oneWayPrice: input.oneWayPrice,
            roundTripPrice: input.roundTripPrice,
            active: true,
          })
          .where(eq(vehicleZonePrices.id, existing.id));
        return db.query.vehicleZonePrices.findFirst({
          where: eq(vehicleZonePrices.id, existing.id),
          with: { vehicle: true, zone: true },
        });
      } else {
        const [{ id }] = await db.insert(vehicleZonePrices).values({
          ...input,
          active: true,
        }).$returningId();
        return db.query.vehicleZonePrices.findFirst({
          where: eq(vehicleZonePrices.id, id),
          with: { vehicle: true, zone: true },
        });
      }
    }),

  update: clientAuthedQuery
    .input(z.object({
      id: z.number().positive(),
      oneWayPrice: z.string().regex(/^\d+(\.\d{2})?$/).optional(),
      roundTripPrice: z.string().regex(/^\d+(\.\d{2})?$/).optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(vehicleZonePrices).set(data).where(eq(vehicleZonePrices.id, id));
      return db.query.vehicleZonePrices.findFirst({
        where: eq(vehicleZonePrices.id, id),
        with: { vehicle: true, zone: true },
      });
    }),

  delete: clientAuthedQuery
    .input(z.object({ id: z.number().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(vehicleZonePrices).where(eq(vehicleZonePrices.id, input.id));
      return { success: true };
    }),
});
