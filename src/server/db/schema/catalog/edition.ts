import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { works } from "./work";

export const editions = pgTable("editions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workId: uuid("work_id")
    .notNull()
    .references(() => works.id),
  format: text("format").notNull(), // hardcover, paperback, ebook, audiobook
  language: text("language").notNull().default("en"),
  publisher: text("publisher"),
  publicationYear: integer("publication_year"),
  isbn: text("isbn"),
  coverImageUrl: text("cover_image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
