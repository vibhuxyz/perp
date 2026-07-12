import { integer, pgTable, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./user.schema";

export const collateralTable = pgTable("collateral", {

  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  availableBalance: integer().notNull().default(0),
  locked: integer().notNull().default(0),
  updated_at: timestamp(),
});
