import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { editions } from "../catalog/edition";
import { organizations } from "../tenancy/organization";
import { branches } from "../tenancy/branch";

export const copyStatusValues = [
  "available",
  "on_hold",
  "checked_out",
  "overdue",
  "recalled",
  "in_transit",
  "returned_pending_inspection",
  "damaged",
  "under_repair",
  "lost",
  "missing",
  "quarantined",
  "withdrawn",
  "archived",
  "disposed",
] as const;

export const copies = pgTable("copies", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id),
  editionId: uuid("edition_id")
    .notNull()
    .references(() => editions.id),
  barcode: text("barcode").notNull().unique(),
  condition: text("condition").notNull().default("good"), // good, fair, poor, damaged
  status: text("status", { enum: copyStatusValues })
    .notNull()
    .default("available"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
