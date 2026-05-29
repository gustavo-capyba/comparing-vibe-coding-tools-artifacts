import { Router, type IRouter } from "express";
import { eq, desc, count, sql } from "drizzle-orm";
import { db, sightingsTable, usersTable, emergenciesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats/overview", async (_req, res): Promise<void> => {
  const [[{ totalSightings }]] = await Promise.all([
    db.select({ totalSightings: count() }).from(sightingsTable),
  ]);

  const [[{ totalUsers }]] = await Promise.all([
    db.select({ totalUsers: count() }).from(usersTable),
  ]);

  const [[{ activeEmergencies }]] = await Promise.all([
    db.select({ activeEmergencies: count() }).from(emergenciesTable).where(eq(emergenciesTable.resolved, false)),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [[{ sightingsToday }]] = await Promise.all([
    db.select({ sightingsToday: count() }).from(sightingsTable).where(sql`${sightingsTable.createdAt} >= ${today}`),
  ]);

  const topAnimal = await db
    .select({ animalType: sightingsTable.animalType, cnt: count() })
    .from(sightingsTable)
    .groupBy(sightingsTable.animalType)
    .orderBy(desc(count()))
    .limit(1);

  res.json({
    totalSightings,
    totalUsers,
    activeEmergencies,
    sightingsToday,
    mostSpottedAnimal: topAnimal[0]?.animalType ?? null,
  });
});

router.get("/stats/animal-breakdown", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ animalType: sightingsTable.animalType, count: count() })
    .from(sightingsTable)
    .groupBy(sightingsTable.animalType)
    .orderBy(desc(count()));

  res.json(rows);
});

router.get("/stats/recent-activity", async (req, res): Promise<void> => {
  const limit = parseInt((req.query.limit as string) || "20", 10);

  const sightings = await db
    .select({
      id: sightingsTable.id,
      animalType: sightingsTable.animalType,
      description: sightingsTable.description,
      userName: usersTable.name,
      lat: sightingsTable.lat,
      lng: sightingsTable.lng,
      timestamp: sightingsTable.createdAt,
    })
    .from(sightingsTable)
    .leftJoin(usersTable, eq(sightingsTable.userId, usersTable.id))
    .orderBy(desc(sightingsTable.createdAt))
    .limit(limit);

  const emergencies = await db
    .select({
      id: emergenciesTable.id,
      description: emergenciesTable.description,
      userName: usersTable.name,
      lat: emergenciesTable.lat,
      lng: emergenciesTable.lng,
      timestamp: emergenciesTable.createdAt,
    })
    .from(emergenciesTable)
    .leftJoin(usersTable, eq(emergenciesTable.userId, usersTable.id))
    .orderBy(desc(emergenciesTable.createdAt))
    .limit(limit);

  const activity = [
    ...sightings.map(s => ({ kind: "sighting" as const, ...s })),
    ...emergencies.map(e => ({ kind: "emergency" as const, animalType: null, ...e })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);

  res.json(activity);
});

export default router;
