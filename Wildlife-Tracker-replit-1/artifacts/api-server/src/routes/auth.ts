import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { hashPassword, comparePassword, signToken, requireAuth } from "../lib/auth";
import { validateDocument } from "../lib/document-validation";
import type { JwtPayload } from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password, name, nationality, phone, vehiclePlate, documentType, documentNumber } = parsed.data;

  const docValidation = validateDocument(nationality, documentType, documentNumber);
  if (!docValidation.valid) {
    res.status(400).json({ error: docValidation.error });
    return;
  }

  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    email,
    passwordHash,
    name,
    nationality: nationality.toUpperCase(),
    phone,
    vehiclePlate,
    documentType,
    documentNumber,
  }).returning();

  const token = signToken({ userId: user.id, email: user.email });

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      nationality: user.nationality,
      phone: user.phone,
      vehiclePlate: user.vehiclePlate,
      documentType: user.documentType,
      documentNumber: user.documentNumber,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      nationality: user.nationality,
      phone: user.phone,
      vehiclePlate: user.vehiclePlate,
      documentType: user.documentType,
      documentNumber: user.documentNumber,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as typeof req & { user: JwtPayload }).user;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    nationality: user.nationality,
    phone: user.phone,
    vehiclePlate: user.vehiclePlate,
    documentType: user.documentType,
    documentNumber: user.documentNumber,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
