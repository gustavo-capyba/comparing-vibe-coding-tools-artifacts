import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, emergenciesTable, usersTable } from "@workspace/db";
import { CreateEmergencyBody } from "@workspace/api-zod";
import { requireAuth } from "./users";
import { createNotificationsForEmergency } from "../lib/notifications";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/emergencies", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: emergenciesTable.id,
      userId: emergenciesTable.userId,
      userName: usersTable.name,
      lat: emergenciesTable.lat,
      lng: emergenciesTable.lng,
      description: emergenciesTable.description,
      resolved: emergenciesTable.resolved,
      createdAt: emergenciesTable.createdAt,
      resolvedAt: emergenciesTable.resolvedAt,
    })
    .from(emergenciesTable)
    .leftJoin(usersTable, eq(emergenciesTable.userId, usersTable.id));

  res.json(rows);
});

router.post("/emergencies", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = CreateEmergencyBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.clerkId));
  if (!user) { res.status(404).json({ error: "User profile not found" }); return; }

  const [emergency] = await db.insert(emergenciesTable)
    .values({ userId: user.id, ...parsed.data })
    .returning();

  createNotificationsForEmergency(emergency.id, user.id, emergency.description, emergency.lat, emergency.lng)
    .catch(err => logger.error({ err }, "Failed to create emergency notifications"));

  res.status(201).json({ ...emergency, userName: user.name });
});

router.patch("/emergencies/:id/resolve", requireAuth, async (req: any, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [emergency] = await db.update(emergenciesTable)
    .set({ resolved: true, resolvedAt: new Date() })
    .where(eq(emergenciesTable.id, id))
    .returning();

  if (!emergency) { res.status(404).json({ error: "Not found" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, emergency.userId));
  res.json({ ...emergency, userName: user?.name ?? null });
});

export default router;
