import { getDb } from "../api/queries/connection";
import { clients, services, vehicles } from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Create demo client
  const apiKey = "rv_demo_client_12345";
  const [{ id: clientId }] = await db.insert(clients).values({
    name: "Transportes Riviera Maya",
    email: "contact@transportesrm.com",
    domain: "transportesrivieramaya.com",
    apiKey,
    plan: "professional",
    status: "active",
    theme: "light",
    primaryColor: "#C75E3A",
    logoUrl: null,
  }).$returningId();

  console.log(`Created client with ID: ${clientId}`);

  // Create services
  await db.insert(services).values([
    { clientId, name: "Aeropuerto \u2192 Hotel", slug: "airport-to-hotel", icon: "AirplaneLanding", description: "Traslado desde el aeropuerto a tu hotel", basePrice: "45.00", active: true, sortOrder: 1 },
    { clientId, name: "Hotel \u2192 Aeropuerto", slug: "hotel-to-airport", icon: "AirplaneTakeoff", description: "Traslado desde tu hotel al aeropuerto", basePrice: "45.00", active: true, sortOrder: 2 },
    { clientId, name: "Tour Privado", slug: "private-tour", icon: "MapTrifold", description: "Tour personalizado por la zona", basePrice: "85.00", active: true, sortOrder: 3 },
    { clientId, name: "Por Horas", slug: "hourly", icon: "Clock", description: "Servicio de transporte por horas", basePrice: "35.00", active: true, sortOrder: 4 },
  ]);

  console.log("Created services");

  // Create vehicles
  await db.insert(vehicles).values([
    { clientId, name: "Suburban Premium", image: "/vehicle-suburban.jpg", capacityMin: 1, capacityMax: 6, features: ["WiFi", "A/C", "Agua"], basePrice: "125.00", active: true, sortOrder: 1 },
    { clientId, name: "Van Ejecutiva", image: "/vehicle-van.jpg", capacityMin: 1, capacityMax: 10, features: ["WiFi", "A/C", "Agua", "TV"], basePrice: "165.00", active: true, sortOrder: 2 },
    { clientId, name: "Sprinter Luxury", image: "/vehicle-sprinter.jpg", capacityMin: 1, capacityMax: 16, features: ["WiFi", "A/C", "Bar", "TV"], basePrice: "245.00", active: true, sortOrder: 3 },
  ]);

  console.log("Created vehicles");
  console.log("Seed complete!");
}

seed().catch(console.error);
