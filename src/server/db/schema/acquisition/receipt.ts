import { pgTable, uuid, integer, text, timestamp } from "drizzle-orm/pg-core";
import { purchaseOrderLines } from "./purchaseOrderLine";
import { userAccounts } from "../identity-access/user-account";

export const receiptConditionValues = [
  "good",
  "fair",
  "poor",
  "damaged",
] as const;

// Append-only: partial shipments create multiple receipt rows against the
// same line rather than mutating a single "received" flag. §4.7: "receive
// partial shipments... preserve the decision history."
export const receipts = pgTable("receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseOrderLineId: uuid("purchase_order_line_id")
    .notNull()
    .references(() => purchaseOrderLines.id),
  quantityReceived: integer("quantity_received").notNull(),
  condition: text("condition", { enum: receiptConditionValues })
    .notNull()
    .default("good"),
  receivedByUserAccountId: uuid("received_by_user_account_id")
    .notNull()
    .references(() => userAccounts.id),
  idempotencyKey: text("idempotency_key").unique(), // §7: receiving is retry-safe
  receivedAt: timestamp("received_at").notNull().defaultNow(),
});
