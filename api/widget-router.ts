import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { clients, services, vehicles, destinations, vehicleZonePrices, bookings, optionalServices, serviceAirports, serviceTours } from "@db/schema";
import { sendBookingConfirmationEmail } from "./email-router";

function generateCode() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.floor(Math.random() * 90000 + 10000);
  return `RSV-${ts.slice(-4)}-${rnd}`;
}

export const widgetRouter = createRouter({
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
        taxRate: client.taxRate,
        depositEnabled: client.depositEnabled,
        depositPercentage: client.depositPercentage,
        logoUrl: client.logoUrl,
      };
    }),

  listServices: publicQuery
    .input(z.object({ clientId: z.number().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.services.findMany({
        where: and(eq(services.clientId, input.clientId), eq(services.active, true)),
        orderBy: services.sortOrder,
      });
    }),

  listDestinations: publicQuery
    .input(z.object({ clientId: z.number().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.destinations.findMany({
        where: and(eq(destinations.clientId, input.clientId), eq(destinations.active, true)),
        orderBy: destinations.name,
      });
    }),

  listVehicles: publicQuery
    .input(z.object({
      clientId: z.number().positive(),
      destinationId: z.number().positive(),
      tripType: z.enum(["one_way", "round_trip"]).default("one_way"),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const destination = await db.query.destinations.findFirst({
        where: eq(destinations.id, input.destinationId),
      });
      if (!destination) throw new Error("Destination not found");

      const vehicleList = await db.query.vehicles.findMany({
        where: and(eq(vehicles.clientId, input.clientId), eq(vehicles.active, true)),
        orderBy: vehicles.sortOrder,
      });

      const prices = await db.query.vehicleZonePrices.findMany({
        where: and(
          eq(vehicleZonePrices.zoneId, destination.zoneId),
          eq(vehicleZonePrices.active, true)
        ),
      });

      return vehicleList.map(v => {
        const priceRow = prices.find(p => p.vehicleId === v.id);
        const price = priceRow
          ? (input.tripType === "round_trip" ? priceRow.roundTripPrice : priceRow.oneWayPrice)
          : "0.00";
        return { ...v, price };
      });
    }),

  listOptionalServices: publicQuery
    .input(z.object({ clientId: z.number().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.optionalServices.findMany({
        where: and(
          eq(optionalServices.clientId, input.clientId),
          eq(optionalServices.active, true),
        ),
        orderBy: optionalServices.sortOrder,
      });
    }),

  listAirports: publicQuery
    .input(z.object({ clientId: z.number().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.serviceAirports.findMany({
        where: and(
          eq(serviceAirports.clientId, input.clientId),
          eq(serviceAirports.active, true),
        ),
        orderBy: serviceAirports.sortOrder,
      });
    }),

  listTours: publicQuery
    .input(z.object({ clientId: z.number().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.serviceTours.findMany({
        where: and(
          eq(serviceTours.clientId, input.clientId),
          eq(serviceTours.active, true),
        ),
        orderBy: serviceTours.sortOrder,
      });
    }),

  checkAvailability: publicQuery
    .input(z.object({
      clientId: z.number().positive(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      vehicleId: z.number().positive().optional(),
    }))
    .query(async () => {
      return { available: true };
    }),

  createBooking: publicQuery
    .input(z.object({
      apiKey: z.string().min(1),
      serviceId: z.number().positive().optional(),
      destinationId: z.number().positive(),
      tripType: z.enum(["one_way", "round_trip"]).default("one_way"),
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
      selectedOptionalServices: z.array(z.number().positive()).optional(),
      luggage: z.enum(["standard", "oversized", "extra"]).optional(),
      flightNumber: z.string().max(50).optional(),
      airline: z.string().max(100).optional(),
      departureDate: z.string().max(10).optional(),
      departureTime: z.string().max(10).optional(),
      paymentMethod: z.enum(["card", "paypal", "cash"]).default("card"),
      paymentOption: z.enum(["full", "deposit"]).default("full"),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();

      const client = await db.query.clients.findFirst({
        where: eq(clients.apiKey, input.apiKey),
      });
      if (!client || client.status !== "active") throw new Error("Invalid client");

      const destination = await db.query.destinations.findFirst({
        where: eq(destinations.id, input.destinationId),
      });
      if (!destination) throw new Error("Destination not found");

      // Get vehicle price
      const priceRow = await db.query.vehicleZonePrices.findFirst({
        where: and(
          eq(vehicleZonePrices.zoneId, destination.zoneId),
          eq(vehicleZonePrices.vehicleId, input.vehicleId),
        ),
      });
      if (!priceRow) throw new Error("No pricing found for this vehicle and zone");

      const basePrice = input.tripType === "round_trip"
        ? parseFloat(String(priceRow.roundTripPrice))
        : parseFloat(String(priceRow.oneWayPrice));

      // Calculate optional services total
      let optionalServicesTotal = 0;
      if (input.selectedOptionalServices && input.selectedOptionalServices.length > 0) {
        for (const svcId of input.selectedOptionalServices) {
          const svc = await db.query.optionalServices.findFirst({
            where: eq(optionalServices.id, svcId),
          });
          if (svc) {
            const svcPrice = parseFloat(String(svc.price));
            optionalServicesTotal += svc.perPassenger
              ? svcPrice * input.passengers
              : svcPrice;
          }
        }
      }

      const subtotal = basePrice + optionalServicesTotal;
      const taxRate = parseFloat(String(client.taxRate)) / 100;
      const tax = Math.round(subtotal * taxRate * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;

      // Payment calculation
      const depositEnabled = client.depositEnabled;
      const depositPercentage = parseFloat(String(client.depositPercentage)) / 100;
      const paymentOption = input.paymentOption;
      
      let amountPaid = total;
      let balanceDue = 0;
      let paymentStatus: "paid" | "deposit" | "pending" | "balance_due" = "paid";

      if (depositEnabled && paymentOption === "deposit") {
        amountPaid = Math.round(total * depositPercentage * 100) / 100;
        balanceDue = Math.round((total - amountPaid) * 100) / 100;
        paymentStatus = balanceDue > 0 ? "deposit" : "paid";
      }

      const code = generateCode();

      const [{ id }] = await db.insert(bookings).values({
        clientId: client.id,
        code,
        serviceId: input.serviceId,
        zoneId: destination.zoneId,
        destinationId: input.destinationId,
        tripType: input.tripType,
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
        selectedOptionalServices: input.selectedOptionalServices || [],
        luggage: input.luggage || "standard",
        flightNumber: input.flightNumber || null,
        airline: input.airline || null,
        departureDate: input.departureDate || null,
        departureTime: input.departureTime || null,
        paymentMethod: input.paymentMethod,
        status: "confirmed",
        paymentStatus,
        amountPaid: amountPaid.toFixed(2),
        balanceDue: balanceDue.toFixed(2),
        price: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
      }).$returningId();

      const createdBooking = await db.query.bookings.findFirst({ where: eq(bookings.id, id) });

      // Send confirmation email asynchronously (don't block the response)
      if (createdBooking) {
        sendBookingConfirmationEmail(createdBooking.id).catch((err: any) => {
          console.error("[Widget] Failed to send confirmation email:", err?.message || err);
        });
      }

      return createdBooking;
    }),
});
