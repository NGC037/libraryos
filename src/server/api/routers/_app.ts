import { router } from "@/server/api/trpc";

export const appRouter = router({});

export type AppRouter = typeof appRouter;
