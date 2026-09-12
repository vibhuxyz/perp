import { z } from "zod";

// Money crosses the wire as a string: JSON numbers are floats, and floats do not
// survive contact with a balance.
export const colletral = z.object({
  amount: z.string().regex(/^\d+$/, "Must be a positive integer string"),
});
