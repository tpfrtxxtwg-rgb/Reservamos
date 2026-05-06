import { relations } from "drizzle-orm";
import { clients, services, vehicles, bookings } from "./schema";

export const clientsRelations = relations(clients, ({ many }) => ({
  services: many(services),
  vehicles: many(vehicles),
  bookings: many(bookings),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  client: one(clients, { fields: [services.clientId], references: [clients.id] }),
  bookings: many(bookings),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  client: one(clients, { fields: [vehicles.clientId], references: [clients.id] }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  client: one(clients, { fields: [bookings.clientId], references: [clients.id] }),
  service: one(services, { fields: [bookings.serviceId], references: [services.id] }),
  vehicle: one(vehicles, { fields: [bookings.vehicleId], references: [vehicles.id] }),
}));
