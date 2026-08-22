import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { organizations } from "../tenancy/organization";

export const works = pgTable("works", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  primaryAuthor: text("primary_author"),
  subjects: jsonb("subjects").$type<string[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  description: text("description"),
  readingLevel: text("reading_level"),
  visibility: text("visibility").notNull().default("public"), // public, staff_only
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
