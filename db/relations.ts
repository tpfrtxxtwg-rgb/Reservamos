import { relations } from "drizzle-orm";
import { clients, services, vehicles, bookings, zones, destinations, vehicleZonePrices, optionalServices, serviceAirports, serviceTours } from "./schema";

export const clientsRelations = relations(clients, ({ many }) => ({
  services: many(services),
  vehicles: many(vehicles),
  bookings: many(bookings),
  zones: many(zones),
  destinations: many(destinations),
  optionalServices: many(optionalServices),
  airports: many(serviceAirports),
  tours: many(serviceTours),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  client: one(clients, { fields: [services.clientId], references: [clients.id] }),
  bookings: many(bookings),
}));

export const zonesRelations = relations(zones, ({ one, many }) => ({
  client: one(clients, { fields: [zones.clientId], references: [clients.id] }),
  bookings: many(bookings),
  destinations: many(destinations),
  vehiclePrices: many(vehicleZonePrices),
}));

export const destinationsRelations = relations(destinations, ({ one, many }) => ({
  client: one(clients, { fields: [destinations.clientId], references: [clients.id] }),
  zone: one(zones, { fields: [destinations.zoneId], references: [zones.id] }),
  bookings: many(bookings),
}));

export const vehicleZonePricesRelations = relations(vehicleZonePrices, ({ one }) => ({
  zone: one(zones, { fields: [vehicleZonePrices.zoneId], references: [zones.id] }),
  vehicle: one(vehicles, { fields: [vehicleZonePrices.vehicleId], references: [vehicles.id] }),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  client: one(clients, { fields: [vehicles.clientId], references: [clients.id] }),
  bookings: many(bookings),
  zonePrices: many(vehicleZonePrices),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  client: one(clients, { fields: [bookings.clientId], references: [clients.id] }),
  service: one(services, { fields: [bookings.serviceId], references: [services.id] }),
  zone: one(zones, { fields: [bookings.zoneId], references: [zones.id] }),
  destination: one(destinations, { fields: [bookings.destinationId], references: [destinations.id] }),
  vehicle: one(vehicles, { fields: [bookings.vehicleId], references: [vehicles.id] }),
}));
