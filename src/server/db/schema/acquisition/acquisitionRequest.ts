import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { organizations } from "../tenancy/organization";
import { branches } from "../tenancy/branch";
import { people } from "../identity-access/person";
import { budgetAllocations } from "./budgetAllocation";

// §4.7 request lifecycle. Kept as an explicit enum (not free text) so every
// transition can be validated server-side — same discipline as copyStatusValues.
export const acquisitionRequestStatusValues = [
  "draft",
  "submitted",
  "voting",
  "quoted",
  "pending_approval",
  "approved",
  "rejected",
  "ordered",
  "partially_received",
  "received",
  "closed",
  "cancelled",
] as const;

export const acquisitionRequestSourceValues = [
  "member",
  "teacher",
  "faculty",
  "department",
  "staff",
  "gap_analysis",
] as const;

export const acquisitionRequests = pgTable("acquisition_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id),
  requestedByPersonId: uuid("requested_by_person_id")
    .notNull()
    .references(() => people.id),
  source: text("source", { enum: acquisitionRequestSourceValues })
    .notNull()
    .default("staff"),
  budgetAllocationId: uuid("budget_allocation_id").references(
    () => budgetAllocations.id,
  ),
  title: text("title").notNull(), // proposed resource title/description — not yet a catalog record
  justification: text("justification"),
  details: jsonb("details").$type<Record<string, unknown>>(), // author, ISBN, format, quantity, etc.
  status: text("status", { enum: acquisitionRequestStatusValues })
    .notNull()
    .default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
