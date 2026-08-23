import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { organizations } from "../tenancy/organization";
import { branches } from "../tenancy/branch";
import { people } from "./person";

export const onboardingStatusValues = [
  "draft",
  "submitted",
  "awaiting_approval",
  "awaiting_payment",
  "payment_review",
  "approved",
  "active",
  "rejected",
  "expired",
  "suspended",
  "withdrawn",
] as const;

export const onboardingApplications = pgTable("onboarding_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  branchId: uuid("branch_id").references(() => branches.id),
  personId: uuid("person_id").references(() => people.id), // null until the person record is created/matched
  status: text("status", { enum: onboardingStatusValues })
    .notNull()
    .default("draft"),
  memberType: text("member_type"), // student, staff, guardian, external patron...
  submittedFields: jsonb("submitted_fields").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
