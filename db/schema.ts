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
  taxRate: decimal("taxRate", { precision: 5, scale: 2 }).default("16.00").notNull(),
  // Deposit configuration
  depositEnabled: boolean("depositEnabled").default(false).notNull(),
  depositPercentage: decimal("depositPercentage", { precision: 5, scale: 2 }).default("30.00").notNull(),
  logoUrl: text("logoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  apiKeyIdx: index("api_key_idx").on(table.apiKey),
  domainIdx: index("domain_idx").on(table.domain),
}));

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ─── Client Users (Transportation Company Admins) ──────────────────
// Each client (tenant) can have multiple users who manage the account.
// Column names match the snake_case names in the MySQL database.
export const clientUsers = mysqlTable("client_users", {
  id: serial("id").primaryKey(),
  clientId: bigint("client_id", { mode: "number", unsigned: true }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["owner", "admin", "operator"]).default("owner").notNull(),
  active: boolean("active").default(true).notNull(),
  lastSignInAt: timestamp("last_sign_in_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  emailIdx: index("client_user_email_idx").on(table.email),
  clientIdx: index("client_user_client_idx").on(table.clientId),
}));

export type ClientUser = typeof clientUsers.$inferSelect;
export type InsertClientUser = typeof clientUsers.$inferInsert;

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

// ─── Service Airports (for Airport Transfer service type) ──────
export const serviceAirports = mysqlTable("service_airports", {
  id: serial("id").primaryKey(),
  clientId: bigint("client_id", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  city: varchar("city", { length: 100 }),
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type ServiceAirport = typeof serviceAirports.$inferSelect;

// ─── Service Tours (for Private Tour service type) ─────────────
export const serviceTours = mysqlTable("service_tours", {
  id: serial("id").primaryKey(),
  clientId: bigint("client_id", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  duration: varchar("duration", { length: 50 }),
  highlights: text("highlights"),
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00").notNull(),
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type ServiceTour = typeof serviceTours.$inferSelect;

// ─── Zones (Administrative groupings) ──────────────────────────
// Zones are defined by the transportation company. Each zone contains
// a list of destinations (hotels). Prices are set per zone per vehicle.
export const zones = mysqlTable("zones", {
  id: serial("id").primaryKey(),
  clientId: bigint("clientId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  clientIdx: index("zone_client_idx").on(table.clientId),
}));

export type Zone = typeof zones.$inferSelect;
export type InsertZone = typeof zones.$inferInsert;

// ─── Destinations (Hotels - visible to end users) ──────────────
// End users see and select from this list. Each destination belongs
// to a zone, which determines its pricing.
export const destinations = mysqlTable("destinations", {
  id: serial("id").primaryKey(),
  clientId: bigint("clientId", { mode: "number", unsigned: true }).notNull(),
  zoneId: bigint("zoneId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  clientIdx: index("dest_client_idx").on(table.clientId),
  zoneIdx: index("dest_zone_idx").on(table.zoneId),
}));

export type Destination = typeof destinations.$inferSelect;
export type InsertDestination = typeof destinations.$inferInsert;

// ─── Vehicle Zone Prices ───────────────────────────────────────
// Each vehicle has its own price table per zone. This allows
// transportation companies to set different prices for different
// vehicle types serving the same zone.
export const vehicleZonePrices = mysqlTable("vehicle_zone_prices", {
  id: serial("id").primaryKey(),
  zoneId: bigint("zoneId", { mode: "number", unsigned: true }).notNull(),
  vehicleId: bigint("vehicleId", { mode: "number", unsigned: true }).notNull(),
  oneWayPrice: decimal("oneWayPrice", { precision: 10, scale: 2 }).default("0.00").notNull(),
  roundTripPrice: decimal("roundTripPrice", { precision: 10, scale: 2 }).default("0.00").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  zoneVehicleIdx: index("zone_vehicle_idx").on(table.zoneId, table.vehicleId),
}));

export type VehicleZonePrice = typeof vehicleZonePrices.$inferSelect;
export type InsertVehicleZonePrice = typeof vehicleZonePrices.$inferInsert;

// ─── Vehicles ──────────────────────────────────────────────────
export const vehicles = mysqlTable("vehicles", {
  id: serial("id").primaryKey(),
  clientId: bigint("clientId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  image: text("image"),
  capacityMin: int("capacityMin").default(1).notNull(),
  capacityMax: int("capacityMax").default(6).notNull(),
  features: json("features").$type<string[]>(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).default("0.00").notNull(),
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  clientIdx: index("vehicle_client_idx").on(table.clientId),
}));

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

// ─── Optional Services ─────────────────────────────────────────
// Optional add-on services that can be selected during booking
// e.g. shopping stop, car seat, booster seat
export const optionalServices = mysqlTable("optional_services", {
  id: serial("id").primaryKey(),
  clientId: bigint("clientId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00").notNull(),
  perPassenger: boolean("perPassenger").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  clientIdx: index("opt_svc_client_idx").on(table.clientId),
}));

export type OptionalService = typeof optionalServices.$inferSelect;
export type InsertOptionalService = typeof optionalServices.$inferInsert;

// ─── Client Email Settings ──────────────────────────────────────
export const clientEmailSettings = mysqlTable("client_email_settings", {
  id: serial("id").primaryKey(),
  clientId: bigint("clientId", { mode: "number", unsigned: true }).notNull().unique(),
  enabled: boolean("enabled").default(true).notNull(),
  subject: varchar("subject", { length: 255 }).default("Your Reservation Confirmation").notNull(),
  message: text("message").default("Thank you for your reservation. We look forward to serving you.").notNull(),
  pickupInstructions: text("pickupInstructions").default("").notNull(),
  // Email provider selection
  emailProvider: mysqlEnum("email_provider", ["smtp", "sendgrid", "resend"]).default("smtp").notNull(),
  // SMTP configuration
  smtpHost: varchar("smtp_host", { length: 255 }),
  smtpPort: int("smtp_port").default(587),
  smtpUser: varchar("smtp_user", { length: 255 }),
  smtpPass: varchar("smtp_pass", { length: 255 }),
  smtpFrom: varchar("smtp_from", { length: 320 }),
  // API keys for HTTP-based providers (SendGrid, Resend)
  sendgridApiKey: varchar("sendgrid_api_key", { length: 255 }),
  resendApiKey: varchar("resend_api_key", { length: 255 }),
  // Company contact info for the PDF/email
  companyPhone: varchar("company_phone", { length: 50 }),
  companyWebsite: varchar("company_website", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  clientIdx: index("email_settings_client_idx").on(table.clientId),
}));

export type ClientEmailSetting = typeof clientEmailSettings.$inferSelect;
export type InsertClientEmailSetting = typeof clientEmailSettings.$inferInsert;

// ─── Bookings (Reservations) ───────────────────────────────────
export const bookings = mysqlTable("bookings", {
  id: serial("id").primaryKey(),
  clientId: bigint("clientId", { mode: "number", unsigned: true }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  serviceId: bigint("serviceId", { mode: "number", unsigned: true }).notNull(),
  zoneId: bigint("zoneId", { mode: "number", unsigned: true }).notNull(),
  destinationId: bigint("destinationId", { mode: "number", unsigned: true }).notNull(),
  tripType: mysqlEnum("tripType", ["one_way", "round_trip"]).default("one_way").notNull(),
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
  // Flight details for airport transfers
  // Optional services selected by user
  selectedOptionalServices: json("selectedOptionalServices").$type<number[]>(),
  // Luggage info
  luggage: varchar("luggage", { length: 50 }).default("standard"),
  flightNumber: varchar("flightNumber", { length: 50 }),
  airline: varchar("airline", { length: 100 }),
  departureDate: varchar("departureDate", { length: 10 }),
  departureTime: varchar("departureTime", { length: 10 }),
  departureAirline: varchar("departureAirline", { length: 100 }),
  departureFlightNumber: varchar("departureFlightNumber", { length: 50 }),
  hotelPickupTime: varchar("hotelPickupTime", { length: 10 }),
  paymentMethod: mysqlEnum("paymentMethod", ["card", "paypal", "cash"]).default("card").notNull(),
  status: mysqlEnum("status", ["confirmed", "pending", "cancelled"]).default("pending").notNull(),
  // Payment tracking
  paymentStatus: mysqlEnum("paymentStatus", ["paid", "deposit", "pending", "balance_due"]).default("pending").notNull(),
  amountPaid: decimal("amountPaid", { precision: 10, scale: 2 }).default("0.00").notNull(),
  balanceDue: decimal("balanceDue", { precision: 10, scale: 2 }).default("0.00").notNull(),
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
