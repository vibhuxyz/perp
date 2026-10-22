import { z } from "zod";

export const colletral = z.object({
  amount: z.string().regex(/^\d+$/, "Must be a positive integer string"),
});
