import {
  mysqlTable,
  serial,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  int,
  boolean,
  decimal,
  json,
  bigint,
  index,
} from "drizzle-orm/mysql-core";

// ─── Users (OAuth) ─────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Clients (SaaS Tenants) ──────────────────────────────────────
export const clients = mysqlTable("clients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  domain: varchar("domain", { length: 255 }),
  apiKey: varchar("apiKey", { length: 255 }).notNull().unique(),
  plan: mysqlEnum("plan", ["starter", "professional", "enterprise"]).default("starter").notNull(),
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active").notNull(),
  theme: mysqlEnum("theme", ["light", "dark"]).default("light").notNull(),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#C75E3A"),
  logoUrl: text("logoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  apiKeyIdx: index("api_key_idx").on(table.apiKey),
  domainIdx: index("domain_idx").on(table.domain),
}));

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ─── Services ──────────────────────────────────────────────────
export const services = mysqlTable("services", {
  id: serial("id").primaryKey(),
  clientId: bigint("clientId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }).default("MapPin"),
  description: text("description"),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).default("0.00").notNull(),
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  clientSlugIdx: index("client_slug_idx").on(table.clientId, table.slug),
}));

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

// ─── Vehicles ──────────────────────────────────────────────────
export const vehicles = mysqlTable("vehicles", {
  id: serial("id").primaryKey(),
  clientId: bigint("clientId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  image: text("image"),
  capacityMin: int("capacityMin").default(1).notNull(),
  capacityMax: int("capacityMax").default(6).notNull(),
  features: json("features").$type<string[]>(),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).default("0.00").notNull(),
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  clientIdx: index("vehicle_client_idx").on(table.clientId),
}));

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

// ─── Bookings (Reservations) ───────────────────────────────────
export const bookings = mysqlTable("bookings", {
  id: serial("id").primaryKey(),
  clientId: bigint("clientId", { mode: "number", unsigned: true }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  serviceId: bigint("serviceId", { mode: "number", unsigned: true }).notNull(),
  origin: varchar("origin", { length: 500 }).notNull(),
  destination: varchar("destination", { length: 500 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  time: varchar("time", { length: 10 }).notNull(),
  passengers: int("passengers").default(1).notNull(),
  vehicleId: bigint("vehicleId", { mode: "number", unsigned: true }).notNull(),
  passengerName: varchar("passengerName", { length: 255 }).notNull(),
  passengerLastName: varchar("passengerLastName", { length: 255 }).notNull(),
  passengerEmail: varchar("passengerEmail", { length: 320 }).notNull(),
  passengerPhone: varchar("passengerPhone", { length: 50 }),
  passengerNotes: text("passengerNotes"),
  paymentMethod: mysqlEnum("paymentMethod", ["card", "paypal", "cash"]).default("card").notNull(),
  status: mysqlEnum("status", ["confirmed", "pending", "cancelled"]).default("pending").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00").notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0.00").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  codeIdx: index("code_idx").on(table.code),
  clientIdx: index("booking_client_idx").on(table.clientId),
  dateIdx: index("date_idx").on(table.date),
}));

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;
