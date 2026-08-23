import { db } from "@/server/db";
import { policies, policyVersions } from "@/server/db/schema";
import { and, eq, or, isNull, lte, gte } from "drizzle-orm";

type ResolvedPolicy = {
  policyVersionId: string;
  rules: {
    maxActiveLoans: number;
    loanPeriodDays: number;
    renewalLimit: number;
    eligibleMembershipStatuses: string[];
  };
};

// Resolves the MOST SPECIFIC applicable policy: branch+memberType+resourceType beats org-wide defaults.
// This is the inheritance model from §4.1 — org defaults flow down, local exceptions win when present.
export async function resolveCirculationPolicy(params: {
  organizationId: string;
  branchId: string;
  memberType: string | null;
  resourceType: string;
}): Promise<ResolvedPolicy | null> {
  const now = new Date();

  const candidates = await db
    .select({
      branchId: policies.branchId,
      memberType: policies.memberType,
      resourceType: policies.resourceType,
      versionId: policyVersions.id,
      rules: policyVersions.rules,
      publishedAt: policyVersions.publishedAt,
    })
    .from(policies)
    .innerJoin(policyVersions, eq(policyVersions.policyId, policies.id))
    .where(
      and(
        eq(policies.organizationId, params.organizationId),
        or(isNull(policies.branchId), eq(policies.branchId, params.branchId)),
        or(
          isNull(policies.memberType),
          eq(policies.memberType, params.memberType ?? ""),
        ),
        or(
          isNull(policies.resourceType),
          eq(policies.resourceType, params.resourceType),
        ),
        lte(policyVersions.effectiveFrom, now),
        or(
          isNull(policyVersions.effectiveUntil),
          gte(policyVersions.effectiveUntil, now),
        ),
      ),
    );

  if (!candidates.length) return null;

  const scored = candidates.map((c) => ({
    ...c,
    specificity:
      (c.branchId ? 1 : 0) + (c.memberType ? 1 : 0) + (c.resourceType ? 1 : 0),
  }));

  scored.sort(
    (a, b) =>
      b.specificity - a.specificity ||
      b.publishedAt.getTime() - a.publishedAt.getTime(),
  );

  const best = scored[0];
  return {
    policyVersionId: best.versionId,
    rules: best.rules as ResolvedPolicy["rules"],
  };
}
