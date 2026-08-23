import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, orgProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { copies, loans, circulationEvents } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

const LOAN_PERIOD_DAYS = 14; // hardcoded default; Policy Studio (§4.1) replaces this later

export const circulationRouter = router({
  checkout: orgProcedure
    .input(
      z.object({
        barcode: z.string(),
        personId: z.string().uuid(), // the borrower
        idempotencyKey: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Idempotency check FIRST, outside the transaction — a retried request
      // returns the original result instead of erroring or duplicating (§8: "barcode scanned twice or network retried")
      const [existingEvent] = await db
        .select()
        .from(circulationEvents)
        .where(eq(circulationEvents.idempotencyKey, input.idempotencyKey))
        .limit(1);

      if (existingEvent) {
        const [existingLoan] = await db
          .select()
          .from(loans)
          .where(eq(loans.id, existingEvent.loanId!))
          .limit(1);
        return { loan: existingLoan, replayed: true };
      }

      return db.transaction(async (tx) => {
        const [copy] = await tx
          .select()
          .from(copies)
          .where(
            and(
              eq(copies.barcode, input.barcode),
              eq(copies.organizationId, ctx.organizationId!),
            ),
          )
          .limit(1);

        if (!copy)
          throw new TRPCError({ code: "NOT_FOUND", message: "Copy not found" });

        if (copy.status !== "available") {
          // §8: "two staff scan the same copy" / general conflict — explain, don't silently fail
          throw new TRPCError({
            code: "CONFLICT",
            message: `Copy is currently "${copy.status}", not available for checkout`,
          });
        }

        const dueAt = new Date();
        dueAt.setDate(dueAt.getDate() + LOAN_PERIOD_DAYS);

        const [loan] = await tx
          .insert(loans)
          .values({
            organizationId: ctx.organizationId!,
            branchId: copy.branchId,
            copyId: copy.id,
            personId: input.personId,
            status: "active",
            dueAt,
          })
          .returning();

        await tx
          .update(copies)
          .set({ status: "checked_out", updatedAt: new Date() })
          .where(eq(copies.id, copy.id));

        await tx.insert(circulationEvents).values({
          organizationId: ctx.organizationId!,
          copyId: copy.id,
          loanId: loan.id,
          eventType: "checkout",
          actorUserAccountId: ctx.userAccountId!,
          idempotencyKey: input.idempotencyKey,
          metadata: { dueAt: dueAt.toISOString() },
        });

        return { loan, replayed: false };
      });
    }),

  returnItem: orgProcedure
    .input(
      z.object({
        barcode: z.string(),
        idempotencyKey: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existingEvent] = await db
        .select()
        .from(circulationEvents)
        .where(eq(circulationEvents.idempotencyKey, input.idempotencyKey))
        .limit(1);

      if (existingEvent) {
        const [existingLoan] = await db
          .select()
          .from(loans)
          .where(eq(loans.id, existingEvent.loanId!))
          .limit(1);
        return { loan: existingLoan, replayed: true };
      }

      return db.transaction(async (tx) => {
        const [copy] = await tx
          .select()
          .from(copies)
          .where(
            and(
              eq(copies.barcode, input.barcode),
              eq(copies.organizationId, ctx.organizationId!),
            ),
          )
          .limit(1);

        if (!copy)
          throw new TRPCError({ code: "NOT_FOUND", message: "Copy not found" });

        const [activeLoan] = await tx
          .select()
          .from(loans)
          .where(and(eq(loans.copyId, copy.id), eq(loans.status, "active")))
          .limit(1);

        if (!activeLoan) {
          // §8: "a return is recorded after a member is suspended" — return should still be
          // acceptable even in odd account states; here we just handle "no active loan" distinctly
          throw new TRPCError({
            code: "CONFLICT",
            message: "No active loan found for this copy",
          });
        }

        await tx
          .update(loans)
          .set({ status: "returned", returnedAt: new Date() })
          .where(eq(loans.id, activeLoan.id));
        await tx
          .update(copies)
          .set({ status: "available", updatedAt: new Date() })
          .where(eq(copies.id, copy.id));

        await tx.insert(circulationEvents).values({
          organizationId: ctx.organizationId!,
          copyId: copy.id,
          loanId: activeLoan.id,
          eventType: "return",
          actorUserAccountId: ctx.userAccountId!,
          idempotencyKey: input.idempotencyKey,
        });

        const [updatedLoan] = await tx
          .select()
          .from(loans)
          .where(eq(loans.id, activeLoan.id))
          .limit(1);

        return { loan: updatedLoan, replayed: false };
      });
    }),
});
