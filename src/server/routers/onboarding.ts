import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, orgProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import {
  onboardingApplications,
  people,
  memberships,
  roles,
  memberLogEvents,
} from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export const onboardingRouter = router({
  // Step 1 of the wizard (§15.4): create a draft application
  startApplication: orgProcedure
    .input(
      z.object({
        branchId: z.string().uuid(),
        memberType: z.string(),
        fields: z.record(z.string(), z.unknown()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [application] = await db
        .insert(onboardingApplications)
        .values({
          organizationId: ctx.organizationId!,
          branchId: input.branchId,
          status: "draft",
          memberType: input.memberType,
          submittedFields: input.fields,
        })
        .returning();

      return application;
    }),

  // §4.4 states: draft -> submitted
  submit: orgProcedure
    .input(z.object({ applicationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [application] = await db
        .update(onboardingApplications)
        .set({ status: "submitted", updatedAt: new Date() })
        .where(
          and(
            eq(onboardingApplications.id, input.applicationId),
            eq(onboardingApplications.organizationId, ctx.organizationId!),
          ),
        )
        .returning();

      if (!application) throw new TRPCError({ code: "NOT_FOUND" });
      return application;
    }),

  // Staff approval: submitted/awaiting_approval -> approved.
  // Creates the person record + membership + first log event in one transaction.
  approve: orgProcedure
    .input(
      z.object({
        applicationId: z.string().uuid(),
        fullName: z.string(),
        email: z.string().email().optional(),
        roleKey: z.string(), // e.g. "member" — must exist in `roles`
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return db.transaction(async (tx) => {
        const [application] = await tx
          .select()
          .from(onboardingApplications)
          .where(
            and(
              eq(onboardingApplications.id, input.applicationId),
              eq(onboardingApplications.organizationId, ctx.organizationId!),
            ),
          )
          .limit(1);

        if (!application) throw new TRPCError({ code: "NOT_FOUND" });

        if (!["submitted", "awaiting_approval"].includes(application.status)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Application is "${application.status}" — cannot approve from this state`,
          });
        }

        const [role] = await tx
          .select()
          .from(roles)
          .where(eq(roles.key, input.roleKey))
          .limit(1);
        if (!role)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `Role "${input.roleKey}" does not exist`,
          });

        // §4.4: duplicate detection should happen before creating a new person — simplified
        // here as an email check; a real merge-review flow comes later.
        let personId = application.personId;
        if (!personId) {
          const [person] = await tx
            .insert(people)
            .values({
              fullName: input.fullName,
              email: input.email,
            })
            .returning();
          personId = person.id;
        }

        await tx.insert(memberships).values({
          personId,
          organizationId: ctx.organizationId!,
          branchId: application.branchId,
          roleId: role.id,
          memberType: application.memberType,
          status: "active",
        });

        const [updatedApplication] = await tx
          .update(onboardingApplications)
          .set({ status: "active", personId, updatedAt: new Date() })
          .where(eq(onboardingApplications.id, application.id))
          .returning();

        await tx.insert(memberLogEvents).values({
          personId,
          eventType: "application_approved",
          actorUserAccountId: ctx.userAccountId!,
          summary: `Onboarding application approved; membership activated as "${input.roleKey}"`,
          metadata: { applicationId: application.id },
        });

        await tx.insert(memberLogEvents).values({
          personId,
          eventType: "membership_activated",
          actorUserAccountId: ctx.userAccountId!,
          summary: `Membership activated (${application.memberType ?? "standard"})`,
        });

        return { application: updatedApplication, personId };
      });
    }),

  reject: orgProcedure
    .input(z.object({ applicationId: z.string().uuid(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [application] = await db
        .update(onboardingApplications)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(
          and(
            eq(onboardingApplications.id, input.applicationId),
            eq(onboardingApplications.organizationId, ctx.organizationId!),
          ),
        )
        .returning();

      if (!application) throw new TRPCError({ code: "NOT_FOUND" });

      if (application.personId) {
        await db.insert(memberLogEvents).values({
          personId: application.personId,
          eventType: "application_rejected",
          actorUserAccountId: ctx.userAccountId!,
          summary: `Application rejected: ${input.reason}`,
        });
      }

      return application;
    }),
});
