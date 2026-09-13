import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = (req.headers.authorization || req.headers.token) as string;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authentication token missing",
    });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  const secret =
    process.env.ACCESS_TOKEN_JWT_SECRET_KEY ||
    process.env.JWT_SECRET ||
    "change-me";

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    if (decoded.userId) {
      //@ts-ignore
      req.userId = decoded.userId;
      //@ts-ignore
      req.user = decoded;
      next();
    } else {
      res.status(403).json({
        success: false,
        message: "Invalid token payload",
      });
    }
  } catch (e) {
    res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

