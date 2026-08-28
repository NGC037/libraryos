import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
} from "drizzle-orm/pg-core";
import { acquisitionRequests } from "./acquisitionRequest";
import { vendors } from "./vendor";

export const acquisitionQuotes = pgTable("acquisition_quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => acquisitionRequests.id),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id),
  quantity: integer("quantity").notNull().default(1),
  unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  notes: text("notes"),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
