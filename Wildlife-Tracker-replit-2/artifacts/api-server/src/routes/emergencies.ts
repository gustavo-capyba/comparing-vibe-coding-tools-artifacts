import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, emergenciesTable, usersTable } from "@workspace/db";
import { CreateEmergencyBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

router.get("/emergencies", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: emergenciesTable.id,
      userId: emergenciesTable.userId,
      userName: usersTable.name,
      latitude: emergenciesTable.latitude,
      longitude: emergenciesTable.longitude,
      description: emergenciesTable.description,
      status: emergenciesTable.status,
      createdAt: emergenciesTable.createdAt,
    })
    .from(emergenciesTable)
    .leftJoin(usersTable, eq(emergenciesTable.userId, usersTable.id))
    .orderBy(desc(emergenciesTable.createdAt));

  res.json(rows.map((r) => ({ ...r, userName: r.userName ?? "Unknown" })));
});

router.post("/emergencies", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateEmergencyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [emergency] = await db
    .insert(emergenciesTable)
    .values({
      userId: req.userId!,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      description: parsed.data.description,
      status: "active",
    })
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));

  // Simulate park staff notification
  logger.info(
    { emergencyId: emergency.id, userId: req.userId!, latitude: parsed.data.latitude, longitude: parsed.data.longitude },
    "[PARK STAFF NOTIFICATION] Emergency alert triggered"
  );

  res.status(201).json({
    ...emergency,
    userName: user?.name ?? "Unknown",
  });
});

export default router;
