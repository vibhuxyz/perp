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

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const cookieToken = parseCookie(req.headers.cookie, "token");
  const rawAuth = (req.headers.authorization || req.headers.token || cookieToken) as string | undefined;

  if (!rawAuth) {
    return res.status(401).json({
      success: false,
      message: "Authentication token missing",
    });
  }

  const token = rawAuth.startsWith("Bearer ")
    ? rawAuth.slice(7).trim()
    : rawAuth.trim();

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
