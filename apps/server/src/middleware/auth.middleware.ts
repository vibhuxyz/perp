import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

function parseCookie(cookieHeader?: string, name = "token"): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) {
      return decodeURIComponent(v.join("="));
    }
  }
  return undefined;
}

function extractToken(req: Request): string | undefined {
  const cookieToken = parseCookie(req.headers.cookie, "token");
  const rawAuth = (req.headers.authorization || req.headers.token || cookieToken) as string | undefined;
  if (!rawAuth) return undefined;
  return rawAuth.startsWith("Bearer ") ? rawAuth.slice(7).trim() : rawAuth.trim();
}

function handleDemoAuth(token: string, req: Request, next: NextFunction): boolean {
  if (token.startsWith("demo-token-") || token === "demo") {
    req.userId = "demo-user";
    req.user = { userId: "demo-user", email: "demo@perp.exchange" };
    next();
    return true;
  }
  return false;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token missing",
    });
  }

  if (handleDemoAuth(token, req, next)) {
    return;
  }

  const secret =
    process.env.ACCESS_TOKEN_JWT_SECRET_KEY ||
    process.env.JWT_SECRET ||
    "change-me";

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    if (decoded.userId) {
      req.userId = decoded.userId;
      req.user = decoded;
      next();
    } else {
      res.status(403).json({
        success: false,
        message: "Invalid token payload",
      });
    }
  } catch {
    res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}
