import { db } from "./index";
import { organizations, branches } from "./schema";
import { works, editions } from "./schema";
import {
  copies,
  shelfLocations,
  copyExpectedLocations,
  copyObservedLocations,
} from "./schema";
import { eq } from "drizzle-orm";

async function seedCatalog() {
  // Reuse the org/branch seeded in Phase 1 instead of creating duplicates
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, "riverside"))
    .limit(1);
  const [branch] = await db
    .select()
    .from(branches)
    .where(eq(branches.organizationId, org.id))
    .limit(1);

  if (!org || !branch) {
    throw new Error(
      "Run the Phase 1 seed script first — no organization/branch found.",
    );
  }

  const [work] = await db
    .insert(works)
    .values({
      organizationId: org.id,
      title: "Pride and Prejudice",
      primaryAuthor: "Jane Austen",
      subjects: ["Classic Literature", "Romance"],
      tags: ["classic"],
    })
    .returning();

  const [edition] = await db
    .insert(editions)
    .values({
      workId: work.id,
      format: "paperback",
      language: "en",
      publisher: "Penguin Classics",
      publicationYear: 2002,
      isbn: "9780141439518",
    })
    .returning();

  const [shelfLocation] = await db
    .insert(shelfLocations)
    .values({
      branchId: branch.id,
      floor: "Floor 2",
      section: "Humanities",
      aisle: "H-04",
      bay: "3",
      shelf: "5",
      position: 2,
    })
    .returning();

  const [copy] = await db
    .insert(copies)
    .values({
      organizationId: org.id,
      branchId: branch.id,
      editionId: edition.id,
      barcode: "RC-000123",
      status: "available",
    })
    .returning();

  await db.insert(copyExpectedLocations).values({
    copyId: copy.id,
    shelfLocationId: shelfLocation.id,
  });

  await db.insert(copyObservedLocations).values({
    copyId: copy.id,
    shelfLocationId: shelfLocation.id,
    method: "manual",
    confidence: 100,
  });

  console.log("Seeded catalog:", {
    work: work.title,
    copy: copy.barcode,
    location: "Floor 2 → Humanities → H-04 → Bay 3 → Shelf 5 → Pos 2",
  });
}

seedCatalog()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
