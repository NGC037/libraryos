import { pgTable, uuid, integer, text, timestamp } from "drizzle-orm/pg-core";
import { acquisitionRequests } from "./acquisitionRequest";
import { userAccounts } from "../identity-access/user-account";

export const acquisitionApprovalDecisionValues = [
  "approved",
  "rejected",
] as const;

// One row per approval stage decided. §4.7: the number of stages is
// organization-configurable (policy-driven), not hardcoded — the router
// reads the required stage count from the org's acquisition policy and this
// table is simply the append-only record of what was decided at each stage.
export const acquisitionApprovals = pgTable("acquisition_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => acquisitionRequests.id),
  stage: integer("stage").notNull(), // 1-based stage number
  approverUserAccountId: uuid("approver_user_account_id")
    .notNull()
    .references(() => userAccounts.id),
  decision: text("decision", {
    enum: acquisitionApprovalDecisionValues,
  }).notNull(),
  reason: text("reason"), // required by the router when decision = "rejected"
  decidedAt: timestamp("decided_at").notNull().defaultNow(),
});
