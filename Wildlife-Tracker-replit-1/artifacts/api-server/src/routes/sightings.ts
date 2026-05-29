import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, sightingsTable, usersTable } from "@workspace/db";
import { CreateSightingBody, ListSightingsQueryParams, GetSightingParams, GetSightingCrowdParams, GetRecentSightingsQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { notifySubscribersOfSighting } from "../lib/notifications";
import { shouldSuppressNotifications, CROWD_THRESHOLD } from "../lib/crowd-control";
import type { JwtPayload } from "../lib/auth";

const router: IRouter = Router();

router.get("/sightings/stats", async (_req, res): Promise<void> => {
  const sightings = await db.select().from(sightingsTable);
  const emergencyCount = await db.execute<{ count: string }>(
    sql`SELECT COUNT(*) as count FROM emergencies WHERE resolved = false`
  );

  const byType: Record<string, { count: number; lastSeen: string }> = {};
  for (const s of sightings) {
    const key = s.animalType;
    if (!byType[key]) {
      byType[key] = { count: 0, lastSeen: s.createdAt.toISOString() };
    }
    byType[key].count++;
    if (s.createdAt > new Date(byType[key].lastSeen)) {
      byType[key].lastSeen = s.createdAt.toISOString();
    }
  }

  const byAnimalType = Object.entries(byType).map(([animalType, data]) => ({
    animalType,
    count: data.count,
    lastSeen: data.lastSeen,
  }));

  res.json({
    total: sightings.length,
    byAnimalType,
    activeEmergencies: parseInt((emergencyCount.rows[0] as { count: string }).count ?? "0", 10),
  });
});

router.get("/sightings/recent", async (req, res): Promise<void> => {
  const params = GetRecentSightingsQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 10) : 10;

  const rows = await db
    .select({
      id: sightingsTable.id,
      userId: sightingsTable.userId,
      userName: usersTable.name,
      animalType: sightingsTable.animalType,
      description: sightingsTable.description,
      latitude: sightingsTable.latitude,
      longitude: sightingsTable.longitude,
      crowdCount: sightingsTable.crowdCount,
      createdAt: sightingsTable.createdAt,
    })
    .from(sightingsTable)
    .innerJoin(usersTable, eq(sightingsTable.userId, usersTable.id))
    .orderBy(desc(sightingsTable.createdAt))
    .limit(limit);

  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.get("/sightings", async (req, res): Promise<void> => {
  const params = ListSightingsQueryParams.safeParse(req.query);
  const animalType = params.success ? params.data.animalType : undefined;
  const limit = params.success ? (params.data.limit ?? 100) : 100;

  let query = db
    .select({
      id: sightingsTable.id,
      userId: sightingsTable.userId,
      userName: usersTable.name,
      animalType: sightingsTable.animalType,
      description: sightingsTable.description,
      latitude: sightingsTable.latitude,
      longitude: sightingsTable.longitude,
      crowdCount: sightingsTable.crowdCount,
      createdAt: sightingsTable.createdAt,
    })
    .from(sightingsTable)
    .innerJoin(usersTable, eq(sightingsTable.userId, usersTable.id))
    .orderBy(desc(sightingsTable.createdAt))
    .limit(limit);

  if (animalType) {
    const rows = await db
      .select({
        id: sightingsTable.id,
        userId: sightingsTable.userId,
        userName: usersTable.name,
        animalType: sightingsTable.animalType,
        description: sightingsTable.description,
        latitude: sightingsTable.latitude,
        longitude: sightingsTable.longitude,
        crowdCount: sightingsTable.crowdCount,
        createdAt: sightingsTable.createdAt,
      })
      .from(sightingsTable)
      .innerJoin(usersTable, eq(sightingsTable.userId, usersTable.id))
      .where(eq(sightingsTable.animalType, animalType))
      .orderBy(desc(sightingsTable.createdAt))
      .limit(limit);
    res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
    return;
  }

  const rows = await query;
  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/sightings", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;

  const parsed = CreateSightingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));

  const [sighting] = await db
    .insert(sightingsTable)
    .values({
      userId,
      animalType: parsed.data.animalType,
      description: parsed.data.description ?? null,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
    })
    .returning();

  const result = {
    id: sighting.id,
    userId: sighting.userId,
    userName: user?.name ?? "Unknown",
    animalType: sighting.animalType,
    description: sighting.description ?? null,
    latitude: sighting.latitude,
    longitude: sighting.longitude,
    crowdCount: sighting.crowdCount,
    createdAt: sighting.createdAt.toISOString(),
  };

  // Fire-and-forget: notify subscribers
  notifySubscribersOfSighting(
    { ...result, crowdCount: sighting.crowdCount, userName: user?.name ?? "Unknown" },
    userId
  ).catch(() => {});

  res.status(201).json(result);
});

router.get("/sightings/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetSightingParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      id: sightingsTable.id,
      userId: sightingsTable.userId,
      userName: usersTable.name,
      animalType: sightingsTable.animalType,
      description: sightingsTable.description,
      latitude: sightingsTable.latitude,
      longitude: sightingsTable.longitude,
      crowdCount: sightingsTable.crowdCount,
      createdAt: sightingsTable.createdAt,
    })
    .from(sightingsTable)
    .innerJoin(usersTable, eq(sightingsTable.userId, usersTable.id))
    .where(eq(sightingsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Sighting not found" });
    return;
  }

  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.get("/sightings/:id/crowd", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetSightingCrowdParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [sighting] = await db
    .select()
    .from(sightingsTable)
    .where(eq(sightingsTable.id, params.data.id));

  if (!sighting) {
    res.status(404).json({ error: "Sighting not found" });
    return;
  }

  res.json({
    sightingId: sighting.id,
    crowdCount: sighting.crowdCount,
    threshold: CROWD_THRESHOLD,
    suppressed: shouldSuppressNotifications(sighting.crowdCount),
  });
});

export default router;
