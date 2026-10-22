import type { Request, Response } from "express";
import {
  marketSchema,
  userSignInSchema,
  userSignUpSchema,
} from "../vallidation/auth.validate";
import { collateralTable, db, marketTable, usersTable } from "@repo/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { publishCommand } from "../kafka/producer";
import { signAuthTokens, authErrorMessage } from "../lib/authTokens";

async function findUserByEmailOrUsername(email?: string, username?: string) {
  if (email) {
    const [found] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    return found;
  }
  if (username) {
    const [found] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));
    return found;
  }
  return null;
}

export const signUp = async (req: Request, res: Response) => {
  const result = userSignUpSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.issues.map(i => i.message),
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

    const { token, refreshToken } = signAuthTokens(newUser);

    return res.status(201).json({
      success: true,
      msg: "User registered successfully",
      token,
      accessToken: token,
      refreshToken,
      user: newUser,
    });
  } catch (err) {
    console.error("[Auth] Signup error:", err);
    return res.status(500).json({
      success: false,
      msg: authErrorMessage(err, "Failed to create account"),
    });
  }
};

export const signIn = async (req: Request, res: Response) => {
  const result = userSignInSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.issues.map(i => i.message),
    });
  }

  const { email, username, password } = result.data;

  try {
    const existingUser = await findUserByEmailOrUsername(email, username);

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

    const { token, refreshToken } = signAuthTokens(existingUser);

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
  } catch (err) {
    console.error("[Auth] Signin error:", err);
    return res.status(500).json({
      success: false,
      msg: authErrorMessage(err, "Failed to sign in"),
    });
  }
};

export const getMe = async (req: Request, res: Response) => {
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
  } catch (err) {
    console.error("[Auth] GetMe error:", err);
    return res.status(500).json({ success: false, msg: "Failed to fetch user" });
  }
};

export const createMarket = async (req: Request, res: Response) => {
  const result = marketSchema.safeParse(req.body);

  if (!result.success) {
    return res.json({
      errors: result.error.issues.map(i => i.message),       });
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
