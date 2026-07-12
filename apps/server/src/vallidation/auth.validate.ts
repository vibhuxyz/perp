import { z } from "zod";

export const userSignUpSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
});

export const userSignInSchema = z.object({
  email: z.string().optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
});

export const marketSchema = z.object({
  symbol: z.string(),
  imageUrl: z.string(),
});
