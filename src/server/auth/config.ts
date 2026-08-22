import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { db } from "@/server/db";
import { userAccounts, people } from "@/server/db/schema";
import { eq } from "drizzle-orm";

declare module "next-auth" {
  interface Session {
    userAccountId: string;
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        // Dev-only stand-in: real password/PIN/QR verification comes later (§3 of the doc).
        // For now, look up the person by email and issue a session if a user_account exists.
        const email = credentials?.email as string;
        console.log("AUTH ATTEMPT for email:", email);
        if (!email) return null;

        const result = await db
          .select({
            userAccountId: userAccounts.id,
            personId: people.id,
            fullName: people.fullName,
          })
          .from(userAccounts)
          .innerJoin(people, eq(people.id, userAccounts.personId))
          .where(eq(people.email, email))
          .limit(1);

        console.log("AUTH QUERY RESULT:", result);

        if (!result.length) return null;

        return {
          id: result[0].userAccountId,
          name: result[0].fullName,
          email,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as typeof token & { userAccountId?: string }).userAccountId =
          user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.userAccountId = (
        token as typeof token & { userAccountId?: string }
      ).userAccountId as string;
      return session;
    },
  },
  pages: { signIn: "/login" },
};
