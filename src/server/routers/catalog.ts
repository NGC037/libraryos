import { z } from "zod";
import { router, orgProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import {
  works,
  editions,
  copies,
  shelfLocations,
  copyObservedLocations,
} from "@/server/db/schema";
import { eq, and, ilike } from "drizzle-orm";

export const catalogRouter = router({
  search: orgProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return db
        .select({
          workId: works.id,
          title: works.title,
          primaryAuthor: works.primaryAuthor,
        })
        .from(works)
        .where(
          and(
            eq(works.organizationId, ctx.organizationId),
            ilike(works.title, `%${input.query}%`),
          ),
        )
        .limit(20);
    }),

  locateCopy: orgProcedure
    .input(z.object({ barcode: z.string() }))
    .query(async ({ ctx, input }) => {
      const [result] = await db
        .select({
          title: works.title,
          barcode: copies.barcode,
          status: copies.status,
          floor: shelfLocations.floor,
          section: shelfLocations.section,
          aisle: shelfLocations.aisle,
          bay: shelfLocations.bay,
          shelf: shelfLocations.shelf,
          position: shelfLocations.position,
          lastVerifiedAt: copyObservedLocations.observedAt,
        })
        .from(copies)
        .innerJoin(editions, eq(editions.id, copies.editionId))
        .innerJoin(works, eq(works.id, editions.workId))
        .leftJoin(
          copyObservedLocations,
          eq(copyObservedLocations.copyId, copies.id),
        )
        .leftJoin(
          shelfLocations,
          eq(shelfLocations.id, copyObservedLocations.shelfLocationId),
        )
        .where(
          and(
            eq(copies.barcode, input.barcode),
            eq(copies.organizationId, ctx.organizationId),
          ),
        )
        .orderBy(copyObservedLocations.observedAt)
        .limit(1);

      if (!result) return null;

      if (result.status !== "available") {
        return {
          title: result.title,
          barcode: result.barcode,
          status: result.status,
          location: null,
        };
      }

      return {
        title: result.title,
        barcode: result.barcode,
        status: result.status,
        location: {
          path: `${result.floor} → ${result.section} → Row ${result.aisle} → Bay ${result.bay} → Shelf ${result.shelf} → Position ${result.position}`,
          lastVerifiedAt: result.lastVerifiedAt,
        },
      };
    }),
});
