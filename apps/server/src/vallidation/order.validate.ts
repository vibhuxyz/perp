import { z } from "zod";

const NumericStringSchema = z.string().regex(/^\d+(\.\d+)?$/, "Must be a positive numeric string");

export const orderSchema = z.object({
  market: z.string(),
  side: z.enum(["LONG", "SHORT"]),
  type: z.enum(["LIMIT", "MARKET"]),
  quantity: NumericStringSchema,
  price: NumericStringSchema.optional(),
  leverage: NumericStringSchema.optional(),
});
