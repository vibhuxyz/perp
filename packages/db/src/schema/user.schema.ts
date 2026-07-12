import { boolean, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 255 }),
  password: varchar("password", { length: 255 }).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  created_at: timestamp().defaultNow().notNull(),
});
