import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const marketTable = pgTable("market", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  symbol: varchar().unique(),
  imageUrl: varchar(),
});
