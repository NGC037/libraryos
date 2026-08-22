import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { branches } from "../tenancy/branch";

// A structured shelf coordinate — reusable across many copies
export const shelfLocations = pgTable("shelf_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id),
  floor: text("floor"),
  section: text("section"), // e.g. "Humanities"
  aisle: text("aisle"), // e.g. "H-04"
  bay: text("bay"),
  shelf: text("shelf"),
  position: integer("position"), // left-to-right ordinal
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

import { copies } from "./copy";

// Expected placement — what staff assigned this copy to
export const copyExpectedLocations = pgTable("copy_expected_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  copyId: uuid("copy_id")
    .notNull()
    .references(() => copies.id)
    .unique(),
  shelfLocationId: uuid("shelf_location_id")
    .notNull()
    .references(() => shelfLocations.id),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});

// Observed placement — last actual scan/verification (§4.2: "distinguish expected, last scanned, and current operational status")
export const copyObservedLocations = pgTable("copy_observed_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  copyId: uuid("copy_id")
    .notNull()
    .references(() => copies.id),
  shelfLocationId: uuid("shelf_location_id").references(
    () => shelfLocations.id,
  ),
  observedAt: timestamp("observed_at").notNull().defaultNow(),
  method: text("method").notNull().default("manual"), // manual, barcode_scan, vision_scan
  confidence: integer("confidence"), // 0-100, used later for vision-assisted mode (§4.3)
});
