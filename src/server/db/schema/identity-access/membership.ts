import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { people } from "./person";
import { organizations } from "../tenancy/organization";
import { branches } from "../tenancy/branch";
import { roles } from "./role";

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .notNull()
    .references(() => people.id),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  branchId: uuid("branch_id").references(() => branches.id),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id),
  memberType: text("member_type"),
  status: text("status").notNull().default("active"),
  validFrom: timestamp("valid_from").notNull().defaultNow(),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
