import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { people } from "./person";
import { userAccounts } from "./user-account";

// §4.4: distinguishes system-generated events from staff notes; every write is append-only,
// corrections are new adjustment events with a reason — never edits to history.
export const memberLogEventTypeValues = [
  "application_submitted",
  "application_approved",
  "application_rejected",
  "membership_activated",
  "membership_suspended",
  "membership_expired",
  "membership_withdrawn",
  "credential_issued",
  "credential_revoked",
  "credential_replaced",
  "loan_checked_out",
  "loan_returned",
  "loan_overdue",
  "staff_note",
  "correction",
] as const;

export const memberLogEvents = pgTable("member_log_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .notNull()
    .references(() => people.id),
  eventType: text("event_type", { enum: memberLogEventTypeValues }).notNull(),
  actorUserAccountId: uuid("actor_user_account_id").references(
    () => userAccounts.id,
  ), // null for system-generated
  isStaffNote: text("is_staff_note").notNull().default("false"), // "true"/"false" — distinguishes note from system event
  summary: text("summary").notNull(), // human-readable line, e.g. "Credential (QR) revoked"
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  sensitive: text("sensitive").notNull().default("false"), // flags entries needing extra permission to view (§4.4)
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
});
