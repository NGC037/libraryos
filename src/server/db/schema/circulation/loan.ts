import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
import { organizations } from "../tenancy/organization";
import { branches } from "../tenancy/branch";
import { copies } from "../inventory-wayfinding/copy";
import { people } from "../identity-access/person";

export const loanStatusValues = [
  "active",
  "returned",
  "overdue",
  "lost",
  "damaged",
  "transferred",
  "recalled",
] as const;

export const loans = pgTable("loans", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id),
  copyId: uuid("copy_id")
    .notNull()
    .references(() => copies.id),
  personId: uuid("person_id")
    .notNull()
    .references(() => people.id), // the borrower
  status: text("status", { enum: loanStatusValues })
    .notNull()
    .default("active"),
  checkedOutAt: timestamp("checked_out_at").notNull().defaultNow(),
  dueAt: timestamp("due_at").notNull(),
  returnedAt: timestamp("returned_at"),
  renewalCount: integer("renewal_count").notNull().default(0),
});
