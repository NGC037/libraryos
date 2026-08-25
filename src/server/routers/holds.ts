import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, orgProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { holds, copies, editions } from "@/server/db/schema";
import { eq, and, max, sql } from "drizzle-orm";

const PICKUP_WINDOW_DAYS = 3;

export const holdsRouter = router({
  place: orgProcedure
    .input(
      z.object({
        editionId: z.string().uuid(),
        branchId: z.string().uuid(),
        personId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return db.transaction(async (tx) => {
        const [{ maxPos }] = await tx
          .select({
            maxPos: sql<number>`coalesce(max(${holds.queuePosition}), 0)`,
          })
          .from(holds)
          .where(
            and(
              eq(holds.editionId, input.editionId),
              eq(holds.branchId, input.branchId),
              eq(holds.status, "queued"),
            ),
          );

        const [hold] = await tx
          .insert(holds)
          .values({
            organizationId: ctx.organizationId!,
            branchId: input.branchId,
            editionId: input.editionId,
            personId: input.personId,
            status: "queued",
            queuePosition: (maxPos ?? 0) + 1,
          })
          .returning();

        return hold;
      });
    }),

  cancel: orgProcedure
    .input(z.object({ holdId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [existing] = await db
        .select()
        .from(holds)
        .where(eq(holds.id, input.holdId))
        .limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (!["queued", "ready_for_pickup"].includes(existing.status)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Hold is already "${existing.status}"`,
        });
      }

      const [updated] = await db
        .update(holds)
        .set({ status: "cancelled", cancelledAt: new Date() })
        .where(eq(holds.id, input.holdId))
        .returning();

      return updated;
    }),

  listForEdition: orgProcedure
    .input(
      z.object({ editionId: z.string().uuid(), branchId: z.string().uuid() }),
    )
    .query(async ({ input }) => {
      return db
        .select()
        .from(holds)
        .where(
          and(
            eq(holds.editionId, input.editionId),
            eq(holds.branchId, input.branchId),
            eq(holds.status, "queued"),
          ),
        )
        .orderBy(holds.queuePosition);
    }),
});
