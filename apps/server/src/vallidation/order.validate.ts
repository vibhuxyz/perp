import { z } from "zod";

const Side = z.enum(["LONG", "SHORT"]);
const OrderType = z.enum(["LIMIT", "MARKET"]);
const Market = z.string();

export const orderSchema = z
  .object({
    side: Side,
    symbol: Market,
    type: OrderType,
    quantity: z.number().positive(),
    price: z.number().positive().optional(),
    leverage: z.number().positive().optional().default(1),
    postOnly: z.boolean().optional(),
    clientOrderId: z.string().optional(),
    qty: z.number(),
  })
  .refine(
    (data) => {
      if (data.type === "LIMIT" && data.price === undefined) {
        return false;
      }
      return true;
    },
    {
      message: "Price is strictly required when placing a limit order.",
      path: ["price"],
    },
  );
