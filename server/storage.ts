import { db } from "./db";
import {
  sessions,
  breadcrumbs,
  type Session,
  type InsertSession,
  type Breadcrumb,
  type InsertBreadcrumb,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Sessions
  getSessions(): Promise<Session[]>;
  getSession(id: number): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  
  // Breadcrumbs
  getBreadcrumbs(sessionId: number): Promise<Breadcrumb[]>;
  createBreadcrumb(breadcrumb: InsertBreadcrumb): Promise<Breadcrumb>;
}

export class DatabaseStorage implements IStorage {
  async getSessions(): Promise<Session[]> {
    return await db.select().from(sessions).orderBy(desc(sessions.createdAt));
  }

  async getSession(id: number): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db.insert(sessions).values(session).returning();
    return newSession;
  }

  async getBreadcrumbs(sessionId: number): Promise<Breadcrumb[]> {
    return await db.select()
      .from(breadcrumbs)
      .where(eq(breadcrumbs.sessionId, sessionId))
      .orderBy(breadcrumbs.timestamp);
  }

  async createBreadcrumb(breadcrumb: InsertBreadcrumb): Promise<Breadcrumb> {
    const [newBreadcrumb] = await db.insert(breadcrumbs).values(breadcrumb).returning();
    return newBreadcrumb;
  }
}

export const storage = new DatabaseStorage();
