import { z } from "zod";

export const userSignUpSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  username: z.string().min(2, "Username must be at least 2 characters").optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const userSignInSchema = z
  .object({
    email: z.string().email().optional(),
    username: z.string().min(1).optional(),
    password: z.string().min(1, "Password is required"),
  })
  .refine((data) => data.email || data.username, {
    message: "Either email or username is required to sign in",
  });

export const marketSchema = z.object({
  symbol: z.string(),
  imageUrl: z.string(),
});
