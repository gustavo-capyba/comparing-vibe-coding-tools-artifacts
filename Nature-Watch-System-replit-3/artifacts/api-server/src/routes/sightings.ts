import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, sightingsTable, usersTable, subscriptionsTable } from "@workspace/db";
import {
  CreateSightingBody,
  GetSightingsQueryParams,
  GetSightingNearbyUsersQueryParams,
} from "@workspace/api-zod";
import { requireAuth } from "./users";
import { createNotificationsForSighting } from "../lib/notifications";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const CROWD_THRESHOLD = 5;

router.get("/sightings", async (req, res): Promise<void> => {
  const params = GetSightingsQueryParams.safeParse(req.query);
  const limit = params.success && params.data.limit ? params.data.limit : 100;
  const animalType = params.success ? params.data.animalType : undefined;

  let query = db
    .select({
      id: sightingsTable.id,
      userId: sightingsTable.userId,
      userName: usersTable.name,
      animalType: sightingsTable.animalType,
      description: sightingsTable.description,
      lat: sightingsTable.lat,
      lng: sightingsTable.lng,
      timestamp: sightingsTable.createdAt,
    })
    .from(sightingsTable)
    .leftJoin(usersTable, eq(sightingsTable.userId, usersTable.id))
    .orderBy(desc(sightingsTable.createdAt))
    .limit(limit)
    .$dynamic();

  if (animalType) {
    query = query.where(eq(sightingsTable.animalType, animalType));
  }

  const results = await query;
  res.json(results.map(r => ({ ...r, nearbyUserCount: 0 })));
});

router.post("/sightings", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = CreateSightingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.clerkId));
  if (!user) {
    res.status(404).json({ error: "User profile not found. Please complete your profile first." });
    return;
  }

  const [sighting] = await db.insert(sightingsTable)
    .values({ userId: user.id, ...parsed.data })
    .returning();

  const result = {
    ...sighting,
    userName: user.name,
    timestamp: sighting.createdAt,
    nearbyUserCount: 0,
  };

  createNotificationsForSighting(sighting, user).catch(err => {
    logger.error({ err }, "Failed to create notifications for sighting");
  });

  res.status(201).json(result);
});

router.get("/sightings/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db
    .select({
      id: sightingsTable.id,
      userId: sightingsTable.userId,
      userName: usersTable.name,
      animalType: sightingsTable.animalType,
      description: sightingsTable.description,
      lat: sightingsTable.lat,
      lng: sightingsTable.lng,
      timestamp: sightingsTable.createdAt,
    })
    .from(sightingsTable)
    .leftJoin(usersTable, eq(sightingsTable.userId, usersTable.id))
    .where(eq(sightingsTable.id, id));

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, nearbyUserCount: 0 });
});

router.get("/sightings/:id/nearby-users", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const params = GetSightingNearbyUsersQueryParams.safeParse(req.query);
  const radiusKm = params.success && params.data.radiusKm ? params.data.radiusKm : 1;

  const [sighting] = await db.select().from(sightingsTable).where(eq(sightingsTable.id, id));
  if (!sighting) { res.status(404).json({ error: "Not found" }); return; }

  const degPerKm = 1 / 111;
  const latRange = radiusKm * degPerKm;
  const lngRange = radiusKm * degPerKm / Math.cos((sighting.lat * Math.PI) / 180);

  const nearbyUsers = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(
      sql`${usersTable.lat} between ${sighting.lat - latRange} and ${sighting.lat + latRange}
          and ${usersTable.lng} between ${sighting.lng - lngRange} and ${sighting.lng + lngRange}
          and ${usersTable.lat} is not null and ${usersTable.lng} is not null`
    );

  const count = nearbyUsers.length;
  res.json({ count, suppressed: count >= CROWD_THRESHOLD, threshold: CROWD_THRESHOLD });
});

export default router;
