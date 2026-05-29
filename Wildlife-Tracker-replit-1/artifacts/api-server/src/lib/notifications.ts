import { db, subscriptionsTable, notificationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { shouldSuppressNotifications, haversineDistance } from "./crowd-control";
import { logger } from "./logger";

const NOTIFICATION_RADIUS_KM = 2;

interface SightingInfo {
  id: number;
  animalType: string;
  latitude: number;
  longitude: number;
  crowdCount: number;
  userName: string;
}

interface EmergencyInfo {
  id: number;
  description: string;
  latitude: number;
  longitude: number;
  userName: string;
}

/**
 * After a sighting is created, notify all users subscribed to that animal type
 * if crowd control does not suppress the notification.
 */
export async function notifySubscribersOfSighting(
  sighting: SightingInfo,
  creatingUserId: number
): Promise<void> {
  if (shouldSuppressNotifications(sighting.crowdCount)) {
    logger.info(
      { sightingId: sighting.id, crowdCount: sighting.crowdCount },
      "Notifications suppressed due to crowd threshold"
    );
    return;
  }

  const subscriptions = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.animalType, sighting.animalType));

  const message = `${sighting.userName} spotted a ${sighting.animalType} nearby!`;

  for (const sub of subscriptions) {
    if (sub.userId === creatingUserId) continue;
    await db.insert(notificationsTable).values({
      userId: sub.userId,
      type: "sighting",
      message,
      sightingId: sighting.id,
      emergencyId: null,
    });
    // Simulate email notification
    logger.info(
      { userId: sub.userId, animalType: sighting.animalType },
      `[EMAIL SIMULATION] Sending sighting notification: ${message}`
    );
  }
}

/**
 * After an emergency is created, notify all users in the system.
 */
export async function notifyAllUsersOfEmergency(
  emergency: EmergencyInfo,
  creatingUserId: number
): Promise<void> {
  const allUsers = await db.select({ id: usersTable.id }).from(usersTable);
  const message = `EMERGENCY: ${emergency.userName} triggered an alert — ${emergency.description}`;

  for (const user of allUsers) {
    if (user.id === creatingUserId) continue;
    await db.insert(notificationsTable).values({
      userId: user.id,
      type: "emergency",
      message,
      sightingId: null,
      emergencyId: emergency.id,
    });
    logger.info(
      { userId: user.id },
      `[EMAIL SIMULATION] Sending emergency notification: ${message}`
    );
  }

  // Also notify park staff (simulated)
  logger.info(
    { emergencyId: emergency.id, lat: emergency.latitude, lon: emergency.longitude },
    "[PARK STAFF SIMULATION] Emergency alert dispatched to park staff"
  );
}
