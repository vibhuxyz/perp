import { z } from "zod";

export const colletral = z.object({
  amount: z.number().positive(),
});
