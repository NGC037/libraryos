import { pgTable, uuid, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { organizations } from "../tenancy/organization";
import { branches } from "../tenancy/branch";
import { vendors } from "./vendor";
import { acquisitionRequests } from "./acquisitionRequest";
import { budgetAllocations } from "./budgetAllocation";

export const purchaseOrderStatusValues = [
  "open",
  "partially_received",
  "received",
  "cancelled",
] as const;

export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id),
  requestId: uuid("request_id")
    .notNull()
    .references(() => acquisitionRequests.id),
  budgetAllocationId: uuid("budget_allocation_id").references(
    () => budgetAllocations.id,
  ),
  status: text("status", { enum: purchaseOrderStatusValues })
    .notNull()
    .default("open"),
  currency: text("currency").notNull().default("USD"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  idempotencyKey: text("idempotency_key").unique(), // §7: PO creation is a mutation members/staff may retry
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  cancelledAt: timestamp("cancelled_at"),
});
