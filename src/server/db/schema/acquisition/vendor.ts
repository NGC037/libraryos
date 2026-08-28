import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "../tenancy/organization";

export const vendorStatusValues = ["active", "inactive"] as const;

export const vendors = pgTable("vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  terms: text("terms"), // free-text payment/delivery terms, e.g. "Net 30"
  status: text("status", { enum: vendorStatusValues })
    .notNull()
    .default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
