import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, subscriptionsTable } from "@workspace/db";
import { CreateSubscriptionBody, DeleteSubscriptionParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";

const router: IRouter = Router();

router.get("/subscriptions", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;

  const subs = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId));

  res.json(subs.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })));
});

router.post("/subscriptions", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;

  const parsed = CreateSubscriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select({ id: subscriptionsTable.id })
    .from(subscriptionsTable)
    .where(
      and(
        eq(subscriptionsTable.userId, userId),
        eq(subscriptionsTable.animalType, parsed.data.animalType)
      )
    );

  if (existing.length > 0) {
    res.status(400).json({ error: "Already subscribed to this animal type" });
    return;
  }

  const [sub] = await db
    .insert(subscriptionsTable)
    .values({ userId, animalType: parsed.data.animalType })
    .returning();

  res.status(201).json({ ...sub, createdAt: sub.createdAt.toISOString() });
});

router.delete("/subscriptions/:id", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteSubscriptionParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(subscriptionsTable)
    .where(
      and(
        eq(subscriptionsTable.id, params.data.id),
        eq(subscriptionsTable.userId, userId)
      )
    )
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
