  import { z } from "zod";


    const NumericStringSchema = z.string().regex(/^\d+(\.\d+)?$/, "Must be a positive numeric string");

    export const orderSchema = z.object({
        market: z.string(),
        side: z.enum(["LONG", "SHORT"]),
        type: z.enum(["LIMIT"]),
        quantity: NumericStringSchema,
        price: NumericStringSchema,
    });





// leverage: z.number().positive().optional().default(1),
// postOnly: z.boolean().optional(),
// clientOrderId: z.string().optional(),
