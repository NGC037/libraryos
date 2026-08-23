import { db } from "./index";
import { organizations, policies, policyVersions } from "./schema";
import { eq } from "drizzle-orm";

async function seedPolicy() {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, "riverside"))
    .limit(1);
  if (!org) throw new Error("Run Phase 1 seed first");

  const [policy] = await db
    .insert(policies)
    .values({
      organizationId: org.id,
      branchId: null, // org-wide
      memberType: null, // applies to all member types
      resourceType: "book",
      name: "Default book circulation policy",
    })
    .returning();

  await db.insert(policyVersions).values({
    policyId: policy.id,
    version: 1,
    rules: {
      maxActiveLoans: 5,
      loanPeriodDays: 14,
      renewalLimit: 2,
      eligibleMembershipStatuses: ["active"],
    },
    effectiveFrom: new Date(),
  });

  console.log(
    "Seeded default policy: max 5 active loans, 14-day period, active members only",
  );
}

seedPolicy()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
