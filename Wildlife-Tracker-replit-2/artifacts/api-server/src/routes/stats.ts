import { Router, type IRouter } from "express";
import { eq, gte, sql, count, desc } from "drizzle-orm";
import { db, sightingsTable, emergenciesTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats/summary", async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [[{ total }], [{ todayCount }], [{ activeEmergencies }], [{ totalUsers }], [{ recentSightings }]] =
    await Promise.all([
      db.select({ total: count() }).from(sightingsTable),
      db.select({ todayCount: count() }).from(sightingsTable).where(gte(sightingsTable.timestamp, today)),
      db.select({ activeEmergencies: count() }).from(emergenciesTable).where(eq(emergenciesTable.status, "active")),
      db.select({ totalUsers: count() }).from(usersTable),
      db.select({ recentSightings: count() }).from(sightingsTable).where(gte(sightingsTable.timestamp, last24h)),
    ]);

  res.json({
    totalSightings: total,
    sightingsToday: todayCount,
    activeEmergencies,
    totalUsers,
    recentSightings,
  });
});

router.get("/stats/animal-counts", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      animalType: sightingsTable.animalType,
      count: count(),
    })
    .from(sightingsTable)
    .groupBy(sightingsTable.animalType)
    .orderBy(desc(count()));

  res.json(rows);
});

export default router;
