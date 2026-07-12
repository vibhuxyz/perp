import type { NextFunction, Request, Response } from "express";
import {
  marketSchema,
  userSignInSchema,
  userSignUpSchema,
} from "../vallidation/auth.validate";
import { collateralTable, db, marketTable, usersTable } from "@repo/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { publishCommand } from "../kafka/producer";

export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = userSignUpSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(411).json({ errors: result.error.message });
  }

  const { email, username, password } = result.data;

  if (!email || !password) {
    return res.status(400).json({
      msg: "Email and password are required",
    });
  }

  const [existingUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existingUser) {
    return res.status(409).json({
      msg: "User already exists",
    });
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const [newUser] = await db
    .insert(usersTable)
    .values({
      email,
      username,
      password: hashPassword,
    })
    .returning();

  if (!newUser) {
    return res.status(500).json({ msg: "Failed to create user" });
  }

  await db.insert(collateralTable).values({
    userId: newUser.id,
    availableBalance: 0,
    locked: 0,
  });

  const jwtSecret = process.env.JWT_SECRET as string;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is missing from environment variables");
  }

  const token = jwt.sign(
    { userId: newUser.id, email: newUser.email, isAdmin: false },
    jwtSecret,
  );

  res.status(200).json({
    msg: "user signup successfully",
    token,
    newUser,
  });
};

export const signIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = userSignInSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(411).json({ errors: result.error.message });
  }

  const { email, password } = result.data;

  if (!email || !password) {
    return res.status(400).json({
      msg: "Email and password are required",
    });
  }

  const [existingUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  const DUMMY_HASH =
    "$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa";

  const hashToCompare = existingUser?.password || DUMMY_HASH;

  const isCorrect = await bcrypt.compare(password, hashToCompare);

  if (!existingUser || !isCorrect) {
    return res.status(403).json({ msg: "Invalid credentials" });
  }

  const jwtSecret = process.env.JWT_SECRET as string;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is missing from environment variables");
  }

  const token = jwt.sign(
    {
      userId: existingUser.id,
      email: existingUser.email,
      isAdmin: existingUser.isAdmin,
    },
    jwtSecret,
  );
  res.status(200).json({
    msg: "user signin successfully",
    token,
  });
};

export const createMarket = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = marketSchema.safeParse(req.body);

  if (!result.success) {
    return res.json({
      error: result.error.message,
    });
  }
  const { symbol, imageUrl } = result.data;

  try {
    await db
      .insert(marketTable)
      .values({
        symbol,
        imageUrl,
      })
      .onConflictDoUpdate({
        target: marketTable.symbol,
        set: { imageUrl },
      });

    await publishCommand("CREATE_MARKET", { symbol, imageUrl }, symbol);

    return res.status(201).json({
      success: true,
      message: `Market initialized for ${symbol}`,
      market: { symbol, imageUrl },
    });
  } catch (error) {
    console.error("Critical failure in market creation ", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
