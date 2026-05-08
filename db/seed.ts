import { getDb } from "../api/queries/connection";
import { clients, services, vehicles, zones, destinations, vehicleZonePrices } from "./schema";

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
    taxRate: "16.00",
    logoUrl: null,
  }).$returningId();

  console.log(`Created client with ID: ${clientId}`);

  // Create services
  await db.insert(services).values([
    { clientId, name: "Airport Transfer", slug: "airport-transfer", icon: "AirplaneLanding", description: "Private airport transfer service", basePrice: "0.00", active: true, sortOrder: 1 },
    { clientId, name: "Private Tour", slug: "private-tour", icon: "MapTrifold", description: "Custom private tour", basePrice: "0.00", active: true, sortOrder: 2 },
    { clientId, name: "By the Hour", slug: "hourly", icon: "Clock", description: "Hourly transportation service", basePrice: "0.00", active: true, sortOrder: 3 },
  ]);
  console.log("Created services");

  // Create zones (administrative groupings - no prices here)
  const zoneData = [
    { clientId, name: "Zona Hotelera Cancun", active: true, sortOrder: 1 },
    { clientId, name: "Downtown Cancun", active: true, sortOrder: 2 },
    { clientId, name: "Playa del Carmen", active: true, sortOrder: 3 },
    { clientId, name: "Tulum", active: true, sortOrder: 4 },
    { clientId, name: "Puerto Morelos", active: true, sortOrder: 5 },
  ];
  await db.insert(zones).values(zoneData);
  console.log("Created zones");

  // Get created zone IDs
  const createdZones = await db.query.zones.findMany({
    where: (z, { eq }) => eq(z.clientId, clientId),
  });
  const zoneMap = new Map(createdZones.map(z => [z.name, z.id]));

  // Create destinations (hotels) per zone
  // Zone 1: Cancun Hotel Zone
  const zone1Id = zoneMap.get("Zona Hotelera Cancun")!;
  // Zone 2: Downtown Cancun
  const zone2Id = zoneMap.get("Downtown Cancun")!;
  // Zone 3: Playa del Carmen
  const zone3Id = zoneMap.get("Playa del Carmen")!;
  // Zone 4: Tulum
  const zone4Id = zoneMap.get("Tulum")!;
  // Zone 5: Puerto Morelos
  const zone5Id = zoneMap.get("Puerto Morelos")!;

  await db.insert(destinations).values([
    // Zone 1: Cancun Hotel Zone
    { clientId, zoneId: zone1Id, name: "Hyatt Ziva Cancun", active: true, sortOrder: 1 },
    { clientId, zoneId: zone1Id, name: "JW Marriott Cancun", active: true, sortOrder: 2 },
    { clientId, zoneId: zone1Id, name: "The Ritz-Carlton Cancun", active: true, sortOrder: 3 },
    { clientId, zoneId: zone1Id, name: "Hard Rock Hotel Cancun", active: true, sortOrder: 4 },
    { clientId, zoneId: zone1Id, name: "Moon Palace Cancun", active: true, sortOrder: 5 },
    { clientId, zoneId: zone1Id, name: "Secrets The Vine", active: true, sortOrder: 6 },
    { clientId, zoneId: zone1Id, name: "Grand Fiesta Americana Coral Beach", active: true, sortOrder: 7 },
    { clientId, zoneId: zone1Id, name: "Hotel Riu Cancun", active: true, sortOrder: 8 },
    { clientId, zoneId: zone1Id, name: "Le Blanc Spa Resort", active: true, sortOrder: 9 },
    { clientId, zoneId: zone1Id, name: "Omnia Cancun", active: true, sortOrder: 10 },
    // Zone 2: Downtown Cancun
    { clientId, zoneId: zone2Id, name: "Courtyard Cancun", active: true, sortOrder: 11 },
    { clientId, zoneId: zone2Id, name: "Hotel Krystal Cancun", active: true, sortOrder: 12 },
    { clientId, zoneId: zone2Id, name: "Four Points Cancun", active: true, sortOrder: 13 },
    { clientId, zoneId: zone2Id, name: "Holiday Inn Cancun Arenas", active: true, sortOrder: 14 },
    { clientId, zoneId: zone2Id, name: "Adhara Hacienda Cancun", active: true, sortOrder: 15 },
    // Zone 3: Playa del Carmen
    { clientId, zoneId: zone3Id, name: "Fairmont Mayakoba", active: true, sortOrder: 16 },
    { clientId, zoneId: zone3Id, name: "Rosewood Mayakoba", active: true, sortOrder: 17 },
    { clientId, zoneId: zone3Id, name: "Banyan Tree Mayakoba", active: true, sortOrder: 18 },
    { clientId, zoneId: zone3Id, name: "Mahekal Beach Resort", active: true, sortOrder: 19 },
    { clientId, zoneId: zone3Id, name: "The Royal Playa del Carmen", active: true, sortOrder: 20 },
    { clientId, zoneId: zone3Id, name: "Hotel Xcaret Mexico", active: true, sortOrder: 21 },
    { clientId, zoneId: zone3Id, name: "Andaz Mayakoba", active: true, sortOrder: 22 },
    { clientId, zoneId: zone3Id, name: "Grand Velas Riviera Maya", active: true, sortOrder: 23 },
    // Zone 4: Tulum
    { clientId, zoneId: zone4Id, name: "Azulik Tulum", active: true, sortOrder: 24 },
    { clientId, zoneId: zone4Id, name: "Nomade Tulum", active: true, sortOrder: 25 },
    { clientId, zoneId: zone4Id, name: "Be Tulum", active: true, sortOrder: 26 },
    { clientId, zoneId: zone4Id, name: "Habitas Tulum", active: true, sortOrder: 27 },
    { clientId, zoneId: zone4Id, name: "Conrad Tulum", active: true, sortOrder: 28 },
    // Zone 5: Puerto Morelos
    { clientId, zoneId: zone5Id, name: "Excellence Riviera Cancun", active: true, sortOrder: 29 },
    { clientId, zoneId: zone5Id, name: "Now Jade Riviera Cancun", active: true, sortOrder: 30 },
    { clientId, zoneId: zone5Id, name: "Dreams Riviera Cancun", active: true, sortOrder: 31 },
    { clientId, zoneId: zone5Id, name: "Secrets Silversands", active: true, sortOrder: 32 },
    { clientId, zoneId: zone5Id, name: "Hotel Marina El Cid", active: true, sortOrder: 33 },
  ]);
  console.log("Created destinations (hotels)");

  // Create vehicles
  await db.insert(vehicles).values([
    { clientId, name: "Suburban", image: "/vehicle-suburban.jpg", capacityMin: 1, capacityMax: 6, features: ["WiFi", "A/C", "Agua"], active: true, sortOrder: 1 },
    { clientId, name: "Cadillac Escalade", image: "/vehicle-suburban.jpg", capacityMin: 1, capacityMax: 6, features: ["WiFi", "A/C", "Bar", "TV"], active: true, sortOrder: 2 },
    { clientId, name: "Mini Van", image: "/vehicle-van.jpg", capacityMin: 1, capacityMax: 10, features: ["WiFi", "A/C", "Agua", "TV"], active: true, sortOrder: 3 },
    { clientId, name: "Sprinter Van", image: "/vehicle-sprinter.jpg", capacityMin: 1, capacityMax: 16, features: ["WiFi", "A/C", "Bar", "TV"], active: true, sortOrder: 4 },
  ]);
  console.log("Created vehicles");

  // Get vehicle IDs
  const createdVehicles = await db.query.vehicles.findMany({
    where: (v, { eq }) => eq(v.clientId, clientId),
  });
  const vehicleMap = new Map(createdVehicles.map(v => [v.name, v.id]));

  const suburbanId = vehicleMap.get("Suburban")!;
  const escaladeId = vehicleMap.get("Cadillac Escalade")!;
  const miniVanId = vehicleMap.get("Mini Van")!;
  const sprinterId = vehicleMap.get("Sprinter Van")!;

  // Create vehicle zone prices
  // Each vehicle has its own price for each zone
  await db.insert(vehicleZonePrices).values([
    // Zone 1: Cancun Hotel Zone
    { zoneId: zone1Id, vehicleId: suburbanId, oneWayPrice: "45.00", roundTripPrice: "80.00", active: true },
    { zoneId: zone1Id, vehicleId: escaladeId, oneWayPrice: "55.00", roundTripPrice: "95.00", active: true },
    { zoneId: zone1Id, vehicleId: miniVanId, oneWayPrice: "60.00", roundTripPrice: "105.00", active: true },
    { zoneId: zone1Id, vehicleId: sprinterId, oneWayPrice: "85.00", roundTripPrice: "150.00", active: true },
    // Zone 2: Downtown Cancun
    { zoneId: zone2Id, vehicleId: suburbanId, oneWayPrice: "40.00", roundTripPrice: "70.00", active: true },
    { zoneId: zone2Id, vehicleId: escaladeId, oneWayPrice: "50.00", roundTripPrice: "85.00", active: true },
    { zoneId: zone2Id, vehicleId: miniVanId, oneWayPrice: "55.00", roundTripPrice: "95.00", active: true },
    { zoneId: zone2Id, vehicleId: sprinterId, oneWayPrice: "80.00", roundTripPrice: "140.00", active: true },
    // Zone 3: Playa del Carmen
    { zoneId: zone3Id, vehicleId: suburbanId, oneWayPrice: "85.00", roundTripPrice: "150.00", active: true },
    { zoneId: zone3Id, vehicleId: escaladeId, oneWayPrice: "100.00", roundTripPrice: "180.00", active: true },
    { zoneId: zone3Id, vehicleId: miniVanId, oneWayPrice: "110.00", roundTripPrice: "195.00", active: true },
    { zoneId: zone3Id, vehicleId: sprinterId, oneWayPrice: "145.00", roundTripPrice: "260.00", active: true },
    // Zone 4: Tulum
    { zoneId: zone4Id, vehicleId: suburbanId, oneWayPrice: "120.00", roundTripPrice: "210.00", active: true },
    { zoneId: zone4Id, vehicleId: escaladeId, oneWayPrice: "140.00", roundTripPrice: "250.00", active: true },
    { zoneId: zone4Id, vehicleId: miniVanId, oneWayPrice: "155.00", roundTripPrice: "275.00", active: true },
    { zoneId: zone4Id, vehicleId: sprinterId, oneWayPrice: "195.00", roundTripPrice: "350.00", active: true },
    // Zone 5: Puerto Morelos
    { zoneId: zone5Id, vehicleId: suburbanId, oneWayPrice: "55.00", roundTripPrice: "95.00", active: true },
    { zoneId: zone5Id, vehicleId: escaladeId, oneWayPrice: "65.00", roundTripPrice: "115.00", active: true },
    { zoneId: zone5Id, vehicleId: miniVanId, oneWayPrice: "72.00", roundTripPrice: "125.00", active: true },
    { zoneId: zone5Id, vehicleId: sprinterId, oneWayPrice: "95.00", roundTripPrice: "170.00", active: true },
  ]);
  console.log("Created vehicle zone prices");

  console.log("Seed complete!");
}

seed().catch(console.error);
