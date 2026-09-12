  import { z } from "zod";


    const NumericStringSchema = z.string().regex(/^\d+(\.\d+)?$/, "Must be a positive numeric string");

    export const orderSchema = z.object({
        market: z.string(),
        side: z.enum(["LONG", "SHORT"]),
        type: z.enum(["LIMIT", "MARKET"]),
        quantity: NumericStringSchema,
        // A market order has no price; it takes whatever the book offers.
        price: NumericStringSchema.optional(),
        leverage: NumericStringSchema.optional(),
    });





// leverage: z.number().positive().optional().default(1),
// postOnly: z.boolean().optional(),
// clientOrderId: z.string().optional(),
