import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, orgProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import {
  credentials,
  memberLogEvents,
  credentialTypeValues,
} from "@/server/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// §3: tokens are opaque — never encode personal data directly
function generateOpaqueToken() {
  return crypto.randomBytes(24).toString("base64url");
}

export const credentialsRouter = router({
  issue: orgProcedure
    .input(
      z.object({
        personId: z.string().uuid(),
        type: z.enum(credentialTypeValues),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return db.transaction(async (tx) => {
        const token = generateOpaqueToken();
        const [credential] = await tx
          .insert(credentials)
          .values({
            personId: input.personId,
            type: input.type,
            token,
          })
          .returning();

        await tx.insert(memberLogEvents).values({
          personId: input.personId,
          eventType: "credential_issued",
          actorUserAccountId: ctx.userAccountId!,
          summary: `Credential issued (${input.type})`,
          metadata: { credentialId: credential.id },
        });

        return credential;
      });
    }),

  revoke: orgProcedure
    .input(z.object({ credentialId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(credentials)
          .where(eq(credentials.id, input.credentialId))
          .limit(1);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
        if (existing.status !== "active") {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Credential is already "${existing.status}"`,
          });
        }

        const [updated] = await tx
          .update(credentials)
          .set({ status: "revoked", revokedAt: new Date() })
          .where(eq(credentials.id, input.credentialId))
          .returning();

        await tx.insert(memberLogEvents).values({
          personId: existing.personId,
          eventType: "credential_revoked",
          actorUserAccountId: ctx.userAccountId!,
          summary: `Credential revoked (${existing.type})`,
          metadata: { credentialId: existing.id },
        });

        return updated;
      });
    }),

  // §8: "member loses a card" — revoke old, issue new, keep both events on the log card
  replace: orgProcedure
    .input(z.object({ credentialId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(credentials)
          .where(eq(credentials.id, input.credentialId))
          .limit(1);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
        if (existing.status !== "active") {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Credential is already "${existing.status}"`,
          });
        }

        const token = generateOpaqueToken();
        const [newCredential] = await tx
          .insert(credentials)
          .values({
            personId: existing.personId,
            type: existing.type,
            token,
          })
          .returning();

        await tx
          .update(credentials)
          .set({
            status: "replaced",
            revokedAt: new Date(),
            replacedByCredentialId: newCredential.id,
          })
          .where(eq(credentials.id, existing.id));

        await tx.insert(memberLogEvents).values({
          personId: existing.personId,
          eventType: "credential_replaced",
          actorUserAccountId: ctx.userAccountId!,
          summary: `Credential replaced (${existing.type})`,
          metadata: {
            oldCredentialId: existing.id,
            newCredentialId: newCredential.id,
          },
        });

        return newCredential;
      });
    }),

  listForPerson: orgProcedure
    .input(z.object({ personId: z.string().uuid() }))
    .query(async ({ input }) => {
      return db
        .select()
        .from(credentials)
        .where(eq(credentials.personId, input.personId));
    }),
});
