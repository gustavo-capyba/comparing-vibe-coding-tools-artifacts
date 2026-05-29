import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const sightingsTable = pgTable("sightings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  animalType: text("animal_type").notNull(),
  description: text("description"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  crowdCount: integer("crowd_count").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSightingSchema = createInsertSchema(sightingsTable).omit({
  id: true,
  createdAt: true,
  crowdCount: true,
});
export type InsertSighting = z.infer<typeof insertSightingSchema>;
export type Sighting = typeof sightingsTable.$inferSelect;
