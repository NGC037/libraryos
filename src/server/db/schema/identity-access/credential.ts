import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { people } from "./person";

export const credentialTypeValues = [
  "qr",
  "barcode",
  "nfc",
  "rfid",
  "pin",
] as const;
export const credentialStatusValues = [
  "active",
  "revoked",
  "expired",
  "replaced",
] as const;

export const credentials = pgTable("credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .notNull()
    .references(() => people.id),
  type: text("type", { enum: credentialTypeValues }).notNull(),
  token: text("token").notNull().unique(), // opaque per §3 — never encodes personal data directly
  status: text("status", { enum: credentialStatusValues })
    .notNull()
    .default("active"),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  revokedAt: timestamp("revoked_at"),
  replacedByCredentialId: uuid("replaced_by_credential_id"),
});
