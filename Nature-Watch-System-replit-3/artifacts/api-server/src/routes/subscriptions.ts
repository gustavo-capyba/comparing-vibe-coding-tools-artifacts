import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, subscriptionsTable, usersTable } from "@workspace/db";
import { CreateSubscriptionBody } from "@workspace/api-zod";
import { requireAuth } from "./users";

const router: IRouter = Router();

router.get("/subscriptions", requireAuth, async (req: any, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.clerkId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const subs = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, user.id));
  res.json(subs);
});

router.post("/subscriptions", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = CreateSubscriptionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.clerkId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const existing = await db.select().from(subscriptionsTable)
    .where(and(eq(subscriptionsTable.userId, user.id), eq(subscriptionsTable.animalType, parsed.data.animalType)));

  if (existing.length > 0) {
    res.status(201).json(existing[0]);
    return;
  }

  const [sub] = await db.insert(subscriptionsTable)
    .values({ userId: user.id, animalType: parsed.data.animalType, emailNotify: parsed.data.emailNotify ?? false })
    .returning();

  res.status(201).json(sub);
});

router.delete("/subscriptions/:id", requireAuth, async (req: any, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.clerkId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  await db.delete(subscriptionsTable)
    .where(and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, user.id)));

  res.sendStatus(204);
});

export default router;
