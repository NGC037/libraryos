import { pgTable, uuid, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { organizations } from "../tenancy/organization";
import { branches } from "../tenancy/branch";

// §4.7: budget must be checked before a purchase order is issued, not after.
// "spent" is a running total maintained by the PO issuance/cancellation flow,
// never edited directly — see acquisitions.budget.* procedures.
export const budgetAllocations = pgTable("budget_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  branchId: uuid("branch_id").references(() => branches.id), // null = organization-wide budget
  period: text("period").notNull(), // e.g. "2026-Q3" or "2026" — organization-defined granularity
  currency: text("currency").notNull().default("USD"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  committed: numeric("committed", { precision: 12, scale: 2 })
    .notNull()
    .default("0"), // sum of open PO totals against this allocation
  spent: numeric("spent", { precision: 12, scale: 2 }).notNull().default("0"), // sum of received PO totals
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
