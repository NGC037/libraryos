import { db } from "./index";
import {
  organizations,
  branches,
  people,
  userAccounts,
  roles,
  memberships,
} from "./schema";

async function seed() {
  const [org] = await db
    .insert(organizations)
    .values({
      name: "Riverside Community Library",
      slug: "riverside",
    })
    .returning();

  const [branch] = await db
    .insert(branches)
    .values({
      organizationId: org.id,
      name: "Main Branch",
    })
    .returning();

  const [role] = await db
    .insert(roles)
    .values({
      key: "org_admin",
      label: "Organization Administrator",
    })
    .returning();

  const [person] = await db
    .insert(people)
    .values({
      fullName: "Neha Admin",
      email: "neha@example.com",
    })
    .returning();

  const [account] = await db
    .insert(userAccounts)
    .values({
      personId: person.id,
      authProviderId: "credentials:neha@example.com",
    })
    .returning();

  await db.insert(memberships).values({
    personId: person.id,
    organizationId: org.id,
    branchId: branch.id,
    roleId: role.id,
    memberType: "staff",
    status: "active",
  });

  console.log("Seeded:", {
    org: org.name,
    branch: branch.name,
    person: person.fullName,
  });
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
