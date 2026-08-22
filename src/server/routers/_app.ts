import { router, publicProcedure, orgProcedure } from "@/server/api/trpc";

export const appRouter = router({
  ping: publicProcedure.query(() => "pong"),
  whoAmI: orgProcedure.query(({ ctx }) => ctx),
});

export type AppRouter = typeof appRouter;
