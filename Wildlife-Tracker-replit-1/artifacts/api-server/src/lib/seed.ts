import { db, usersTable, sightingsTable } from "@workspace/db";
import { hashPassword } from "./auth";
import { logger } from "./logger";

export async function seedIfEmpty(): Promise<void> {
  const existing = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
  if (existing.length > 0) return;

  logger.info("Seeding initial data...");

  const pw = await hashPassword("password123");

  const [alice] = await db.insert(usersTable).values({
    email: "alice@example.com",
    passwordHash: pw,
    name: "Alice Ranger",
    nationality: "BR",
    phone: "+55 81 99999-0001",
    vehiclePlate: "ABC-1234",
    documentType: "cpf",
    documentNumber: "529.982.247-25",
  }).returning();

  const [bob] = await db.insert(usersTable).values({
    email: "bob@example.com",
    passwordHash: pw,
    name: "Bob Tracker",
    nationality: "US",
    phone: "+1 555 000-0002",
    vehiclePlate: "XYZ-5678",
    documentType: "driver_license",
    documentNumber: "D1234567",
  }).returning();

  // Sightings near Recife, Brazil
  await db.insert(sightingsTable).values([
    { userId: alice.id, animalType: "Capybara", description: "Spotted near the river bank", latitude: -8.065, longitude: -34.873, crowdCount: 2 },
    { userId: bob.id, animalType: "Toucan", description: "Flying above the canopy", latitude: -8.060, longitude: -34.869, crowdCount: 1 },
    { userId: alice.id, animalType: "Jaguar", description: "Brief sighting on the trail", latitude: -8.070, longitude: -34.878, crowdCount: 1 },
    { userId: bob.id, animalType: "Capybara", description: null, latitude: -8.058, longitude: -34.865, crowdCount: 6 },
    { userId: alice.id, animalType: "Howler Monkey", description: "Large group in the trees", latitude: -8.055, longitude: -34.860, crowdCount: 3 },
  ]);

  logger.info("Seeding complete. Demo users: alice@example.com and bob@example.com (password: password123)");
}
