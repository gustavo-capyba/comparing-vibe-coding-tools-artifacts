import { pgTable, text, serial, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const emergenciesTable = pgTable("emergencies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  description: text("description"),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const insertEmergencySchema = createInsertSchema(emergenciesTable).omit({ id: true, createdAt: true });
export type InsertEmergency = z.infer<typeof insertEmergencySchema>;
export type Emergency = typeof emergenciesTable.$inferSelect;
