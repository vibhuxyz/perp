import { integer, numeric, pgEnum, pgTable, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";
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



export const positionsTable = pgTable("positions", {
      id: text("id").primaryKey(),
      userId: text("user_id").notNull(),
      market: text("market").notNull(), // e.g., "BTC-PERP"
      side: text("side").notNull(), // "LONG" | "SHORT"
      quantity: numeric("quantity", { precision: 30, scale: 0 }).notNull().default("0"),
      margin: numeric("margin", { precision: 30, scale: 0 }).notNull().default("0"),
      liquidationPrice: numeric("liquidation_price", { precision: 30, scale: 2 }), // Might have decimals
      averagePrice: numeric("average_price", { precision: 30, scale: 2 }),
      updatedAt: timestamp("updated_at").defaultNow(),
    }, (table) => {
      return {
        // A user can only have ONE position per market.
        userMarketUnique: unique("user_market_unique").on(table.userId, table.market),
      };
    });
