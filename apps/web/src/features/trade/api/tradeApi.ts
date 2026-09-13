import { z } from "zod";
import { api } from "@/shared/lib/api";

const levelSchema = z.object({
  price: z.string(),
  quantity: z.string(),
});

const depthSchema = z.object({
  market: z.string(),
  bids: z.array(levelSchema),
  asks: z.array(levelSchema),
  lastTradePrice: z.string().nullable(),
  indexPrice: z.string(),
});

const positionSchema = z.object({
  market: z.string(),
  side: z.enum(["LONG", "SHORT"]),
  quantity: z.string(),
  averagePrice: z.string(),
  margin: z.string(),
  liquidationPrice: z.string(),
});

const equitySchema = z.object({
  availableBalance: z.string(),
  marginLocked: z.string(),
});

const placedOrderSchema = z.object({
  orderId: z.string(),
  status: z.enum(["filled", "resting", "cancelled"]),
  filledQuantity: z.string(),
  fills: z.number(),
});

export type Depth = z.infer<typeof depthSchema>;
export type Position = z.infer<typeof positionSchema>;
export type Equity = z.infer<typeof equitySchema>;
export type PlacedOrder = z.infer<typeof placedOrderSchema>;

export interface PlaceOrderInput {
  market: string;
  side: "LONG" | "SHORT";
  type: "LIMIT" | "MARKET";
  quantity: string;
  price?: string;
  leverage: string;
}

export const fetchDepth = (market: string) =>
  api(`/api/depth/${market}`, depthSchema);

export const fetchPositions = () =>
  api("/api/positions", z.array(positionSchema));

export const fetchEquity = () => api("/api/equity", equitySchema);

export const placeOrder = (input: PlaceOrderInput) =>
  api("/api/order", placedOrderSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });

export const deposit = (amount: string) =>
  api("/api/wallet/onramp", equitySchema, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });

export const closePosition = (market: string) =>
  api("/api/positions/close", z.object({ success: z.boolean() }), {
    method: "POST",
    body: JSON.stringify({ market }),
  });
