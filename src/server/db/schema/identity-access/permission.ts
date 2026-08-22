import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { roles } from "./role";

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id),
  action: text("action").notNull(),
  scope: text("scope").notNull().default("organization"),
});
