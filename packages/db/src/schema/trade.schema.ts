import { numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const tradesTable = pgTable("trades", {
  id: text("id").primaryKey(),
  market: text("market").notNull(),
  price: numeric("price", { precision: 30, scale: 0 }).notNull(),
  quantity: numeric("quantity", { precision: 30, scale: 0 }).notNull(),
  makerOrderId: text("maker_order_id").notNull(),
  makerUserId: text("maker_user_id").notNull(),
  takerOrderId: text("taker_order_id").notNull(),
  takerUserId: text("taker_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const candlesTable = pgTable("candles", {
  time: timestamp("time").notNull(),
  market: text("market").notNull(),
  resolution: text("resolution").notNull().default("1m"),
  open: numeric("open", { precision: 30, scale: 0 }).notNull(),
  high: numeric("high", { precision: 30, scale: 0 }).notNull(),
  low: numeric("low", { precision: 30, scale: 0 }).notNull(),
  close: numeric("close", { precision: 30, scale: 0 }).notNull(),
  volume: numeric("volume", { precision: 30, scale: 0 }).notNull(),
});
