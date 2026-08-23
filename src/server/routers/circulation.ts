import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, orgProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import {
  copies,
  loans,
  circulationEvents,
  memberships,
  memberLogEvents,
} from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { resolveCirculationPolicy } from "@/server/policy-engine/evaluate";

export const circulationRouter = router({
  checkout: orgProcedure
    .input(
      z.object({
        barcode: z.string(),
        personId: z.string().uuid(),
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

        if (copy.status !== "available") {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Copy is currently "${copy.status}", not available for checkout`,
          });
        }

        // §3: eligibility depends on the member's actual membership record — status, member type
        const [membership] = await tx
          .select()
          .from(memberships)
          .where(
            and(
              eq(memberships.personId, input.personId),
              eq(memberships.organizationId, ctx.organizationId!),
            ),
          )
          .limit(1);

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "No membership found for this person in this organization",
          });
        }

        // §4.1: resolve the most specific applicable policy (branch/member-type/resource-type override org defaults)
        const policy = await resolveCirculationPolicy({
          organizationId: ctx.organizationId!,
          branchId: copy.branchId,
          memberType: membership.memberType,
          resourceType: "book",
        });

        if (!policy) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "No circulation policy configured for this organization",
          });
        }

        // §15.3 "Explain before asking" — every rejection names WHY, not just "action failed"
        if (
          !policy.rules.eligibleMembershipStatuses.includes(membership.status)
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Membership status "${membership.status}" is not eligible to borrow under the current policy`,
          });
        }

        const [{ count }] = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(loans)
          .where(
            and(eq(loans.personId, input.personId), eq(loans.status, "active")),
          );

        if (count >= policy.rules.maxActiveLoans) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Member already has ${count} active loan(s), at or above the policy limit of ${policy.rules.maxActiveLoans}`,
          });
        }

        const dueAt = new Date();
        dueAt.setDate(dueAt.getDate() + policy.rules.loanPeriodDays);

        const [loan] = await tx
          .insert(loans)
          .values({
            organizationId: ctx.organizationId!,
            branchId: copy.branchId,
            copyId: copy.id,
            personId: input.personId,
            policyVersionId: policy.policyVersionId,
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
          metadata: {
            dueAt: dueAt.toISOString(),
            policyVersionId: policy.policyVersionId,
          },
        });

        await tx.insert(memberLogEvents).values({
          personId: input.personId,
          eventType: "loan_checked_out",
          actorUserAccountId: ctx.userAccountId!,
          summary: `Checked out copy ${copy.barcode}`,
          metadata: {
            loanId: loan.id,
            copyId: copy.id,
            dueAt: dueAt.toISOString(),
          },
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

        await tx.insert(memberLogEvents).values({
          personId: activeLoan.personId,
          eventType: "loan_returned",
          actorUserAccountId: ctx.userAccountId!,
          summary: `Returned copy ${copy.barcode}`,
          metadata: { loanId: activeLoan.id, copyId: copy.id },
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
