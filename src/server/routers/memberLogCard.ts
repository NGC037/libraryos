import { z } from "zod";
import { router, orgProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { memberLogEvents } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { hasPermission } from "@/server/policy-engine/permissions";

export const memberLogCardRouter = router({
  getForPerson: orgProcedure
    .input(z.object({ personId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const canViewSensitive = await hasPermission({
        userAccountId: ctx.userAccountId!,
        organizationId: ctx.organizationId!,
        action: "member_log:view_sensitive",
      });

      const events = await db
        .select()
        .from(memberLogEvents)
        .where(eq(memberLogEvents.personId, input.personId))
        .orderBy(desc(memberLogEvents.occurredAt));

      if (canViewSensitive) return events;

      // §4.4: redact, don't omit — staff still see something happened without exposing details
      return events.map((e) =>
        e.sensitive === "true"
          ? { ...e, summary: "[Restricted entry]", metadata: null }
          : e,
      );
    }),
});
