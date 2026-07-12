import "./load-env";
import { drizzle } from "drizzle-orm/node-postgres";
export * from "./schema/index";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to initialize the database");
}

export const db = drizzle(databaseUrl);
