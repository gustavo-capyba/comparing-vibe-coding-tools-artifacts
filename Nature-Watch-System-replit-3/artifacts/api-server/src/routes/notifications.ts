import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, notificationsTable, usersTable } from "@workspace/db";
import { GetNotificationsQueryParams } from "@workspace/api-zod";
import { requireAuth } from "./users";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req: any, res): Promise<void> => {
  const params = GetNotificationsQueryParams.safeParse(req.query);
  const unreadOnly = params.success ? params.data.unreadOnly : undefined;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.clerkId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  let query = db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, user.id))
    .$dynamic();

  if (unreadOnly === true) {
    query = query.where(and(eq(notificationsTable.userId, user.id), eq(notificationsTable.read, false)));
  }

  const notifs = await query;
  res.json(notifs);
});

router.patch("/notifications/:id/read", requireAuth, async (req: any, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.clerkId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const [notif] = await db.update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, user.id)))
    .returning();

  if (!notif) { res.status(404).json({ error: "Not found" }); return; }
  res.json(notif);
});

router.patch("/notifications/read-all", requireAuth, async (req: any, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.clerkId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const updated = await db.update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.userId, user.id), eq(notificationsTable.read, false)))
    .returning();

  res.json({ updated: updated.length });
});

export default router;
