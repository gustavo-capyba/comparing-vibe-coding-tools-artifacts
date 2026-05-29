import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, emergenciesTable, usersTable } from "@workspace/db";
import { CreateEmergencyBody, ResolveEmergencyParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { notifyAllUsersOfEmergency } from "../lib/notifications";
import type { JwtPayload } from "../lib/auth";

const router: IRouter = Router();

router.get("/emergencies", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: emergenciesTable.id,
      userId: emergenciesTable.userId,
      userName: usersTable.name,
      description: emergenciesTable.description,
      latitude: emergenciesTable.latitude,
      longitude: emergenciesTable.longitude,
      resolved: emergenciesTable.resolved,
      createdAt: emergenciesTable.createdAt,
      resolvedAt: emergenciesTable.resolvedAt,
    })
    .from(emergenciesTable)
    .innerJoin(usersTable, eq(emergenciesTable.userId, usersTable.id))
    .orderBy(desc(emergenciesTable.createdAt));

  res.json(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
    }))
  );
});

router.post("/emergencies", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;

  const parsed = CreateEmergencyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));

  const [emergency] = await db
    .insert(emergenciesTable)
    .values({
      userId,
      description: parsed.data.description,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
    })
    .returning();

  const result = {
    id: emergency.id,
    userId: emergency.userId,
    userName: user?.name ?? "Unknown",
    description: emergency.description,
    latitude: emergency.latitude,
    longitude: emergency.longitude,
    resolved: emergency.resolved,
    createdAt: emergency.createdAt.toISOString(),
    resolvedAt: emergency.resolvedAt ? emergency.resolvedAt.toISOString() : null,
  };

  // Fire-and-forget: notify all users
  notifyAllUsersOfEmergency(
    { id: emergency.id, description: emergency.description, latitude: emergency.latitude, longitude: emergency.longitude, userName: user?.name ?? "Unknown" },
    userId
  ).catch(() => {});

  res.status(201).json(result);
});

router.patch("/emergencies/:id/resolve", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ResolveEmergencyParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      id: emergenciesTable.id,
      userId: emergenciesTable.userId,
      userName: usersTable.name,
    })
    .from(emergenciesTable)
    .innerJoin(usersTable, eq(emergenciesTable.userId, usersTable.id))
    .where(eq(emergenciesTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Emergency not found" });
    return;
  }

  const [updated] = await db
    .update(emergenciesTable)
    .set({ resolved: true, resolvedAt: new Date() })
    .where(eq(emergenciesTable.id, params.data.id))
    .returning();

  res.json({
    ...updated,
    userName: row.userName,
    createdAt: updated.createdAt.toISOString(),
    resolvedAt: updated.resolvedAt ? updated.resolvedAt.toISOString() : null,
  });
});

export default router;
