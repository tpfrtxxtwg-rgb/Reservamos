import { z } from "zod";
import { eq, and, gte, lte } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { clients, services, vehicles, bookings } from "@db/schema";

function generateCode() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.floor(Math.random() * 90000 + 10000);
  return `RSV-${ts.slice(-4)}-${rnd}`;
}

export const widgetRouter = createRouter({
  // Get client config by API key
  config: publicQuery
    .input(z.object({ apiKey: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = getDb();
      const client = await db.query.clients.findFirst({
        where: eq(clients.apiKey, input.apiKey),
      });
      if (!client || client.status !== "active") {
        throw new Error("Invalid or inactive client");
      }
      return {
        id: client.id,
        name: client.name,
        theme: client.theme,
        primaryColor: client.primaryColor,
        logoUrl: client.logoUrl,
      };
    }),

  // List active services for a client
  listServices: publicQuery
    .input(z.object({ clientId: z.number().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.services.findMany({
        where: and(eq(services.clientId, input.clientId), eq(services.active, true)),
        orderBy: services.sortOrder,
      });
    }),

  // List active vehicles for a client
  listVehicles: publicQuery
    .input(z.object({ clientId: z.number().positive(), passengers: z.number().min(1).max(50).optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [eq(vehicles.clientId, input.clientId), eq(vehicles.active, true)];
      if (input.passengers) {
        conditions.push(gte(vehicles.capacityMax, input.passengers));
        conditions.push(lte(vehicles.capacityMin, input.passengers));
      }
      return db.query.vehicles.findMany({
        where: and(...conditions),
        orderBy: vehicles.sortOrder,
      });
    }),

  // Check availability (simplified — always available for MVP)
  checkAvailability: publicQuery
    .input(z.object({
      clientId: z.number().positive(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      vehicleId: z.number().positive().optional(),
    }))
    .query(async () => {
      // MVP: always return available time slots
      // In production, check against existing bookings
      return { available: true };
    }),

  // Create booking from widget
  createBooking: publicQuery
    .input(z.object({
      apiKey: z.string().min(1),
      serviceId: z.number().positive(),
      origin: z.string().min(1).max(500),
      destination: z.string().min(1).max(500),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      time: z.string().min(1).max(10),
      passengers: z.number().min(1).max(50),
      vehicleId: z.number().positive(),
      passengerName: z.string().min(1).max(255),
      passengerLastName: z.string().min(1).max(255),
      passengerEmail: z.string().email(),
      passengerPhone: z.string().max(50).optional(),
      passengerNotes: z.string().optional(),
      paymentMethod: z.enum(["card", "paypal", "cash"]).default("card"),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();

      // Validate client
      const client = await db.query.clients.findFirst({
        where: eq(clients.apiKey, input.apiKey),
      });
      if (!client || client.status !== "active") {
        throw new Error("Invalid client");
      }

      // Get vehicle price
      const vehicle = await db.query.vehicles.findFirst({
        where: eq(vehicles.id, input.vehicleId),
      });
      if (!vehicle) throw new Error("Vehicle not found");

      const basePrice = parseFloat(vehicle.basePrice);
      const taxRate = 0.08;
      const tax = Math.round(basePrice * taxRate * 100) / 100;
      const total = Math.round((basePrice + tax) * 100) / 100;

      const code = generateCode();

      const [{ id }] = await db.insert(bookings).values({
        clientId: client.id,
        code,
        serviceId: input.serviceId,
        origin: input.origin,
        destination: input.destination,
        date: input.date,
        time: input.time,
        passengers: input.passengers,
        vehicleId: input.vehicleId,
        passengerName: input.passengerName,
        passengerLastName: input.passengerLastName,
        passengerEmail: input.passengerEmail,
        passengerPhone: input.passengerPhone || null,
        passengerNotes: input.passengerNotes || null,
        paymentMethod: input.paymentMethod,
        status: "confirmed",
        price: basePrice.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
      }).$returningId();

      const newBooking = await db.query.bookings.findFirst({
        where: eq(bookings.id, id),
        with: {
          service: true,
          vehicle: true,
        },
      });

      return newBooking;
    }),
});
