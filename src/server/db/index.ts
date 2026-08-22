import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

config({ path: ".env.local" });

import * as schema from "./schema/index";

const client = postgres(process.env.DATABASE_URL!);

export const db = drizzle(client, { schema });

export * from "./schema/tenancy/organization";
export * from "./schema/tenancy/branch";
export * from "./schema/identity-access/person";
export * from "./schema/identity-access/user-account";
export * from "./schema/identity-access/role";
export * from "./schema/identity-access/membership";
export * from "./schema/identity-access/permission";
export * from "./schema/catalog/work";
export * from "./schema/catalog/edition";
export * from "./schema/inventory-wayfinding/copy";
export * from "./schema/inventory-wayfinding/location";
