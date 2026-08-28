import { pgTable, uuid, text, integer, numeric } from "drizzle-orm/pg-core";
import { purchaseOrders } from "./purchaseOrder";
import { editions } from "../catalog/edition";

// editionId is nullable: a PO line can be raised before the resource exists
// as a catalog edition (common for new-title requests). Receiving against a
// line without an edition triggers the "create catalog record" step before
// accessioning — receiving against a line WITH an edition just adds copies.
export const purchaseOrderLines = pgTable("purchase_order_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseOrderId: uuid("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.id),
  editionId: uuid("edition_id").references(() => editions.id),
  description: text("description").notNull(),
  quantityOrdered: integer("quantity_ordered").notNull(),
  quantityReceived: integer("quantity_received").notNull().default(0),
  unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).notNull(),
});
