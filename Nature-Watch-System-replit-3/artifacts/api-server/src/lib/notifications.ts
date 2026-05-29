import { eq } from "drizzle-orm";
import { db, subscriptionsTable, notificationsTable, usersTable } from "@workspace/db";
import type { Sighting, User } from "@workspace/db";
import { logger } from "./logger";

const CROWD_THRESHOLD = 5;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function createNotificationsForSighting(sighting: Sighting, reporter: User) {
  const subs = await db
    .select({ id: subscriptionsTable.id, userId: subscriptionsTable.userId, emailNotify: subscriptionsTable.emailNotify })
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.animalType, sighting.animalType));

  if (subs.length === 0) return;

  const usersWithLocation = await db
    .select({ id: usersTable.id, lat: usersTable.lat, lng: usersTable.lng })
    .from(usersTable)
    .where(
      // users that have location set
      eq(usersTable.id, usersTable.id)
    );

  const nearbyCount = usersWithLocation.filter(u =>
    u.lat != null && u.lng != null &&
    haversineKm(sighting.lat, sighting.lng, u.lat!, u.lng!) <= 1
  ).length;

  if (nearbyCount >= CROWD_THRESHOLD) {
    logger.info({ sightingId: sighting.id, nearbyCount }, "Crowd threshold reached, suppressing notifications");
    return;
  }

  for (const sub of subs) {
    if (sub.userId === reporter.id) continue;

    await db.insert(notificationsTable).values({
      userId: sub.userId,
      type: "sighting",
      title: `${sighting.animalType} spotted nearby!`,
      body: sighting.description
        ? `${reporter.name ?? "A visitor"} spotted a ${sighting.animalType}: ${sighting.description}`
        : `${reporter.name ?? "A visitor"} spotted a ${sighting.animalType}`,
      sightingId: sighting.id,
    });

    if (sub.emailNotify) {
      logger.info(
        { userId: sub.userId, animalType: sighting.animalType },
        `[EMAIL SIMULATION] Sending email notification: ${sighting.animalType} spotted nearby`
      );
    }
  }
}

export async function createNotificationsForEmergency(emergencyId: number, userId: number, description: string | null, lat: number, lng: number) {
  const allUsers = await db.select({ id: usersTable.id }).from(usersTable);
  for (const u of allUsers) {
    if (u.id === userId) continue;
    await db.insert(notificationsTable).values({
      userId: u.id,
      type: "emergency",
      title: "Emergency Alert!",
      body: description
        ? `Emergency near (${lat.toFixed(4)}, ${lng.toFixed(4)}): ${description}`
        : `Emergency reported near (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      emergencyId,
    });
  }
  logger.info({ emergencyId, lat, lng }, "[STAFF SIMULATION] Notifying park staff of emergency");
}
