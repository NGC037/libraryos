import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "../tenancy/organization";
import { branches } from "../tenancy/branch";
import { editions } from "../catalog/edition";
import { people } from "../identity-access/person";
import { copies } from "../inventory-wayfinding/copy";

// Holds queue on a WORK/EDITION, not a specific copy — any available copy of that
// edition can fulfill the hold (§4.5: waitlists span the pool of copies, not one item)
export const holdStatusValues = [
  "queued",
  "ready_for_pickup",
  "fulfilled",
  "expired",
  "cancelled",
] as const;

export const holds = pgTable("holds", {
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
  personId: uuid("person_id")
    .notNull()
    .references(() => people.id),
  status: text("status", { enum: holdStatusValues })
    .notNull()
    .default("queued"),
  queuePosition: integer("queue_position").notNull(),
  fulfilledCopyId: uuid("fulfilled_copy_id").references(() => copies.id), // set when a copy is actually assigned
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  readyAt: timestamp("ready_at"), // when it became ready for pickup
  pickupExpiresAt: timestamp("pickup_expires_at"), // §4.11: "pickup expiry" notification trigger
  fulfilledAt: timestamp("fulfilled_at"),
  cancelledAt: timestamp("cancelled_at"),
});
