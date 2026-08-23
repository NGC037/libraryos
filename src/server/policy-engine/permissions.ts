import { db } from "@/server/db";
import { memberships, userAccounts, permissions } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function hasPermission(params: {
  userAccountId: string;
  organizationId: string;
  action: string;
}): Promise<boolean> {
  const [row] = await db
    .select({ permissionId: permissions.id })
    .from(userAccounts)
    .innerJoin(memberships, eq(memberships.personId, userAccounts.personId))
    .innerJoin(permissions, eq(permissions.roleId, memberships.roleId))
    .where(
      and(
        eq(userAccounts.id, params.userAccountId),
        eq(memberships.organizationId, params.organizationId),
        eq(memberships.status, "active"),
        eq(permissions.action, params.action),
      ),
    )
    .limit(1);

  return !!row;
}
