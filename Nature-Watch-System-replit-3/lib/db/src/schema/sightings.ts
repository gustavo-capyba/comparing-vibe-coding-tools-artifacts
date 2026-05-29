import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sightingsTable = pgTable("sightings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  animalType: text("animal_type").notNull(),
  description: text("description"),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSightingSchema = createInsertSchema(sightingsTable).omit({ id: true, createdAt: true });
export type InsertSighting = z.infer<typeof insertSightingSchema>;
export type Sighting = typeof sightingsTable.$inferSelect;
