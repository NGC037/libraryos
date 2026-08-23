import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { organizations } from "../tenancy/organization";
import { copies } from "../inventory-wayfinding/copy";
import { loans } from "./loan";
import { userAccounts } from "../identity-access/user-account";

export const circulationEventTypeValues = [
  "checkout",
  "return",
  "renew",
  "hold_placed",
  "hold_fulfilled",
  "transfer",
  "recall",
  "exception_override",
] as const;

export const circulationEvents = pgTable("circulation_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  copyId: uuid("copy_id")
    .notNull()
    .references(() => copies.id),
  loanId: uuid("loan_id").references(() => loans.id),
  eventType: text("event_type", { enum: circulationEventTypeValues }).notNull(),
  actorUserAccountId: uuid("actor_user_account_id").references(
    () => userAccounts.id,
  ),
  reason: text("reason"), // required when staff override a policy (§4.5)
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  idempotencyKey: text("idempotency_key").unique(), // §7 Phase 4: every op safe to retry
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
});
