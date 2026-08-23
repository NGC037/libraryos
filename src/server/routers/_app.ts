import { router, publicProcedure, orgProcedure } from "@/server/api/trpc";
import { catalogRouter } from "./catalog";
import { circulationRouter } from "./circulation";
import { onboardingRouter } from "./onboarding";
import { memberLogCardRouter } from "./memberLogCard";
import { credentialsRouter } from "./credentials";

export const appRouter = router({
  ping: publicProcedure.query(() => "pong"),
  whoAmI: orgProcedure.query(({ ctx }) => ctx),
  catalog: catalogRouter,
  circulation: circulationRouter,
  onboarding: onboardingRouter,
  memberLogCard: memberLogCardRouter,
  credentials: credentialsRouter,
});

export type AppRouter = typeof appRouter;
  