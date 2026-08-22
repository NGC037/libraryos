import { router, publicProcedure, orgProcedure } from "@/server/api/trpc";
import { catalogRouter } from "./catalog";

export const appRouter = router({
  ping: publicProcedure.query(() => "pong"),
  whoAmI: orgProcedure.query(({ ctx }) => ctx),
    catalog: catalogRouter,

});

export type AppRouter = typeof appRouter;
