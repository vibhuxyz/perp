import { integer, pgEnum, pgTable, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./user.schema";
import { marketTable } from "./market.schema";

// 1. Declare enums
export const sideEnum = pgEnum("order_side", ["LONG", "SHORT"]);

export const orderStatusEnum = pgEnum("order_status", [
  "queued",
  "open",
  "filled",
  "cancelled",
  "partially_filled",
]);
export const orderTypeEnum = pgEnum("order_type", ["LIMIT", "MARKET"]);

export const orderTable = pgTable("orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  side: sideEnum("side").notNull(),
  market: integer("marketId")
    .notNull()
    .references(() => marketTable.id, { onDelete: "cascade" }),

  qty: integer("qty").notNull(),
  filledQty: integer("filled_qty").notNull(),
  price: integer("price").notNull(),
  equity: integer("equity"),
  status: orderStatusEnum("status").notNull(),
  type: orderTypeEnum("order_type").notNull(),

  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
});
