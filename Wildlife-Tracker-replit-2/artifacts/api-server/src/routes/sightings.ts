import { Router, type IRouter } from "express";
import { eq, desc, gte, and } from "drizzle-orm";
import { db, sightingsTable, usersTable, subscriptionsTable, notificationsTable } from "@workspace/db";
import { CreateSightingBody, ListSightingsQueryParams, GetSightingParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth.js";
import { checkCrowdControl, CROWD_WINDOW_MS } from "../lib/crowd-control.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

router.get("/sightings", async (req, res): Promise<void> => {
  const query = ListSightingsQueryParams.safeParse(req.query);
  const conditions = [];

  if (query.success && query.data.animalType) {
    conditions.push(eq(sightingsTable.animalType, query.data.animalType));
  }

  const rows = await db
    .select({
      id: sightingsTable.id,
      userId: sightingsTable.userId,
      userName: usersTable.name,
      animalType: sightingsTable.animalType,
      latitude: sightingsTable.latitude,
      longitude: sightingsTable.longitude,
      notes: sightingsTable.notes,
      crowdCount: sightingsTable.crowdCount,
      notificationsSuppressed: sightingsTable.notificationsSuppressed,
      timestamp: sightingsTable.timestamp,
      createdAt: sightingsTable.createdAt,
    })
    .from(sightingsTable)
    .leftJoin(usersTable, eq(sightingsTable.userId, usersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(sightingsTable.timestamp))
    .limit(query.success && query.data.limit ? query.data.limit : 200);

  res.json(rows.map((r) => ({ ...r, userName: r.userName ?? "Unknown" })));
});

router.get("/sightings/recent", async (_req, res): Promise<void> => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      id: sightingsTable.id,
      userId: sightingsTable.userId,
      userName: usersTable.name,
      animalType: sightingsTable.animalType,
      latitude: sightingsTable.latitude,
      longitude: sightingsTable.longitude,
      notes: sightingsTable.notes,
      crowdCount: sightingsTable.crowdCount,
      notificationsSuppressed: sightingsTable.notificationsSuppressed,
      timestamp: sightingsTable.timestamp,
      createdAt: sightingsTable.createdAt,
    })
    .from(sightingsTable)
    .leftJoin(usersTable, eq(sightingsTable.userId, usersTable.id))
    .where(gte(sightingsTable.timestamp, cutoff))
    .orderBy(desc(sightingsTable.timestamp));

  res.json(rows.map((r) => ({ ...r, userName: r.userName ?? "Unknown" })));
});

router.post("/sightings", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateSightingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { animalType, latitude, longitude, notes, timestamp } = parsed.data;

  // Crowd control check
  const cutoff = new Date(Date.now() - CROWD_WINDOW_MS);
  const recent = await db
    .select({
      latitude: sightingsTable.latitude,
      longitude: sightingsTable.longitude,
      userId: sightingsTable.userId,
      timestamp: sightingsTable.timestamp,
    })
    .from(sightingsTable)
    .where(gte(sightingsTable.timestamp, cutoff));

  const { suppressed, crowdCount } = checkCrowdControl(recent, latitude, longitude);

  const [sighting] = await db
    .insert(sightingsTable)
    .values({
      userId: req.userId!,
      animalType,
      latitude,
      longitude,
      notes,
      crowdCount,
      notificationsSuppressed: suppressed,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    })
    .returning();

  // Get user info for response
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));

  // Dispatch notifications if not suppressed
  if (!suppressed) {
    const subscribers = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.animalType, animalType));

    for (const sub of subscribers) {
      if (sub.userId === req.userId!) continue; // don't notify reporter
      const message = `New ${animalType} sighting reported near your subscribed area!`;
      await db.insert(notificationsTable).values({
        userId: sub.userId,
        sightingId: sighting.id,
        animalType,
        message,
      });
      if (sub.emailNotify) {
        logger.info({ userId: sub.userId, animalType }, `[EMAIL SIMULATION] Notification sent for ${animalType} sighting`);
      }
    }
  } else {
    req.log.info({ crowdCount }, "Notifications suppressed due to crowd threshold");
  }

  res.status(201).json({
    ...sighting,
    userName: user?.name ?? "Unknown",
  });
});

router.get("/sightings/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetSightingParams.safeParse({ id: parseInt(raw, 10) });
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
      latitude: sightingsTable.latitude,
      longitude: sightingsTable.longitude,
      notes: sightingsTable.notes,
      crowdCount: sightingsTable.crowdCount,
      notificationsSuppressed: sightingsTable.notificationsSuppressed,
      timestamp: sightingsTable.timestamp,
      createdAt: sightingsTable.createdAt,
    })
    .from(sightingsTable)
    .leftJoin(usersTable, eq(sightingsTable.userId, usersTable.id))
    .where(eq(sightingsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Sighting not found" });
    return;
  }

  res.json({ ...row, userName: row.userName ?? "Unknown" });
});

export default router;
