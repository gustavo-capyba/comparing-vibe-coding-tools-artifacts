import { pgTable, text, serial, timestamp, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sightingsTable = pgTable("sightings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  animalType: text("animal_type").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  notes: text("notes"),
  crowdCount: integer("crowd_count").notNull().default(0),
  notificationsSuppressed: boolean("notifications_suppressed").notNull().default(false),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSightingSchema = createInsertSchema(sightingsTable).omit({
  id: true,
  createdAt: true,
  crowdCount: true,
  notificationsSuppressed: true,
});
export type InsertSighting = z.infer<typeof insertSightingSchema>;
export type Sighting = typeof sightingsTable.$inferSelect;
