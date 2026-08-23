import { router, publicProcedure, orgProcedure } from "@/server/api/trpc";
import { catalogRouter } from "./catalog";
import { circulationRouter } from "./circulation";

export const appRouter = router({
  ping: publicProcedure.query(() => "pong"),
  whoAmI: orgProcedure.query(({ ctx }) => ctx),
  catalog: catalogRouter,
  circulation: circulationRouter,
});

export type AppRouter = typeof appRouter;
