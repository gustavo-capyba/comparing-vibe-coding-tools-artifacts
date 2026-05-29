import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  UpsertMeBody,
  UpdateMyLocationBody,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.clerkId = clerkId;
  next();
};

router.get("/users/me", requireAuth, async (req: any, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.clerkId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const latLng = user.lat != null && user.lng != null ? `${user.lat},${user.lng}` : null;
  res.json({ ...user, latLng });
});

router.put("/users/me", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = UpsertMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const auth = getAuth(req);
  const email = (auth as any)?.sessionClaims?.email as string | undefined;
  const name = parsed.data.name ?? (auth as any)?.sessionClaims?.name as string | undefined;

  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.clerkId));

  let user;
  if (existing.length > 0) {
    [user] = await db.update(usersTable)
      .set({ ...parsed.data, name: name ?? existing[0].name, email: email ?? existing[0].email })
      .where(eq(usersTable.clerkId, req.clerkId))
      .returning();
  } else {
    [user] = await db.insert(usersTable)
      .values({ clerkId: req.clerkId, email: email ?? null, name: name ?? null, ...parsed.data })
      .returning();
  }

  const latLng = user.lat != null && user.lng != null ? `${user.lat},${user.lng}` : null;
  res.json({ ...user, latLng });
});

router.put("/users/me/location", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = UpdateMyLocationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db.update(usersTable)
    .set({ lat: parsed.data.lat, lng: parsed.data.lng })
    .where(eq(usersTable.clerkId, req.clerkId));

  res.json({ success: true });
});

export default router;
export { requireAuth };
