import { pgTable, text, serial, timestamp, integer, doublePrecision, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Neighborhood Run - Dec 21"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Store raw GPS points to reconstruct paths or debug
export const breadcrumbs = pgTable("breadcrumbs", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(), // Intentionally not using FK constraint for simplicity in MVP, but could add .references(() => sessions.id)
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  accuracy: doublePrecision("accuracy"), // GPS accuracy in meters
  timestamp: timestamp("timestamp").defaultNow(),
});

// Store the "segments" that have been fully visited to persist progress
// In a real app, we might store OSM way IDs, but for MVP we'll just store the geometry or rely on breadcrumbs + client logic
// For this MVP, we will rely on client-side calculation from breadcrumbs + OSM data for simplicity,
// but we'll store breadcrumbs to reload history.

// === BASE SCHEMAS ===
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true, createdAt: true });
export const insertBreadcrumbSchema = createInsertSchema(breadcrumbs).omit({ id: true, timestamp: true });

// === EXPLICIT API CONTRACT TYPES ===
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type Breadcrumb = typeof breadcrumbs.$inferSelect;
export type InsertBreadcrumb = z.infer<typeof insertBreadcrumbSchema>;

export type CreateSessionRequest = {
  name: string;
};

export type AddBreadcrumbRequest = {
  sessionId: number;
  lat: number;
  lng: number;
  accuracy?: number;
};

export type SessionResponse = Session;
export type BreadcrumbResponse = Breadcrumb;
