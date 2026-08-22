import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { memberships, userAccounts } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function createContext() {
  const session = await auth();
  return {
    userAccountId: session?.userAccountId ?? null,
    organizationId: null as string | null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const orgProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userAccountId) throw new TRPCError({ code: "UNAUTHORIZED" });

  const [row] = await db
    .select({ organizationId: memberships.organizationId })
    .from(memberships)
    .innerJoin(userAccounts, eq(userAccounts.personId, memberships.personId))
    .where(
      and(
        eq(userAccounts.id, ctx.userAccountId),
        eq(memberships.status, "active"),
      ),
    )
    .limit(1);

  if (!row)
    throw new TRPCError({ code: "FORBIDDEN", message: "No active membership" });

  return next({ ctx: { ...ctx, organizationId: row.organizationId } });
});
