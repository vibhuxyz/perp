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
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.format(),
    });
  }

  const { email, password } = result.data;
  const username = result.data.username || email.split("@")[0];

  try {
    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (existingUser) {
      return res.status(409).json({
        success: false,
        msg: "A user with this email already exists",
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
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        username: usersTable.username,
        isAdmin: usersTable.isAdmin,
        created_at: usersTable.created_at,
      });

    if (!newUser) {
      return res.status(500).json({ success: false, msg: "Failed to create user" });
    }

    await db.insert(collateralTable).values({
      id: crypto.randomUUID(),
      userId: String(newUser.id),
      availableBalance: "0",
      locked: "0",
    });

    const accessSecret =
      process.env.ACCESS_TOKEN_JWT_SECRET_KEY ||
      process.env.JWT_SECRET ||
      "change-me";
    const refreshSecret =
      process.env.REFRESH_TOKEN_JWT_SECRET_KEY || accessSecret;

    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        username: newUser.username,
        isAdmin: newUser.isAdmin,
      },
      accessSecret,
      { expiresIn: "7d" },
    );

    const refreshToken = jwt.sign(
      { userId: newUser.id },
      refreshSecret,
      { expiresIn: "30d" },
    );

    return res.status(201).json({
      success: true,
      msg: "User registered successfully",
      token,
      accessToken: token,
      refreshToken,
      user: newUser,
    });
  } catch (err: any) {
    console.error("[Auth] Signup error:", err);
    return res.status(500).json({
      success: false,
      msg: err.message || "Failed to create account",
    });
  }
};

export const signIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = userSignInSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.format(),
    });
  }

  const { email, username, password } = result.data;

  try {
    let existingUser = null;
    if (email) {
      const [found] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));
      existingUser = found;
    } else if (username) {
      const [found] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.username, username));
      existingUser = found;
    }

    const DUMMY_HASH =
      "$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa";

    const hashToCompare = existingUser?.password || DUMMY_HASH;
    const isCorrect = await bcrypt.compare(password, hashToCompare);

    if (!existingUser || !isCorrect) {
      return res.status(401).json({
        success: false,
        msg: "Invalid email/username or password",
      });
    }

    const accessSecret =
      process.env.ACCESS_TOKEN_JWT_SECRET_KEY ||
      process.env.JWT_SECRET ||
      "change-me";
    const refreshSecret =
      process.env.REFRESH_TOKEN_JWT_SECRET_KEY || accessSecret;

    const token = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email,
        username: existingUser.username,
        isAdmin: existingUser.isAdmin,
      },
      accessSecret,
      { expiresIn: "7d" },
    );

    const refreshToken = jwt.sign(
      { userId: existingUser.id },
      refreshSecret,
      { expiresIn: "30d" },
    );

    const user = {
      id: existingUser.id,
      email: existingUser.email,
      username: existingUser.username,
      isAdmin: existingUser.isAdmin,
    };

    return res.status(200).json({
      success: true,
      msg: "Signed in successfully",
      token,
      accessToken: token,
      refreshToken,
      user,
    });
  } catch (err: any) {
    console.error("[Auth] Signin error:", err);
    return res.status(500).json({
      success: false,
      msg: err.message || "Failed to sign in",
    });
  }
};

export const getMe = async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ success: false, msg: "Unauthorized" });
  }

  try {
    const [user] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        username: usersTable.username,
        isAdmin: usersTable.isAdmin,
        created_at: usersTable.created_at,
      })
      .from(usersTable)
      .where(eq(usersTable.id, Number(userId)));

    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    const [collateral] = await db
      .select()
      .from(collateralTable)
      .where(eq(collateralTable.userId, String(user.id)));

    return res.status(200).json({
      success: true,
      user,
      collateral: collateral || {
        availableBalance: "0",
        locked: "0",
      },
    });
  } catch (err: any) {
    console.error("[Auth] GetMe error:", err);
    return res.status(500).json({ success: false, msg: "Failed to fetch user" });
  }
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
