import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { people } from "./person";

export const userAccounts = pgTable("user_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .notNull()
    .references(() => people.id),
  authProviderId: text("auth_provider_id").notNull().unique(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
