import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { organizations } from "./organization";
import { branches } from "./branch";

// A "slot" defining WHO this policy applies to — org-wide by default, narrowable per branch/member type/resource type
export const policies = pgTable("policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  branchId: uuid("branch_id").references(() => branches.id), // null = organization-wide
  memberType: text("member_type"), // null = applies to all member types
  resourceType: text("resource_type"), // null = applies to all resource types
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// The actual rule values — versioned so historical loans stay tied to the rules that governed them (§8)
export const policyVersions = pgTable("policy_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  policyId: uuid("policy_id")
    .notNull()
    .references(() => policies.id),
  version: integer("version").notNull(),
  rules: jsonb("rules")
    .$type<{
      maxActiveLoans: number;
      loanPeriodDays: number;
      renewalLimit: number;
      eligibleMembershipStatuses: string[];
    }>()
    .notNull(),
  effectiveFrom: timestamp("effective_from").notNull().defaultNow(),
  effectiveUntil: timestamp("effective_until"), // null = still the active version
  publishedAt: timestamp("published_at").notNull().defaultNow(),
});
