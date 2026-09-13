import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

// NOTE: the previous version called `ipKeyGenerator(req)`, passing the whole
// Express Request where the library expects an IP string
// (ipKeyGenerator(ip: string, ipv6Subnet?)). That only type-checked because
// the callback was typed `any`; correctly typing it here surfaces the bug.
const keyGenerator = (req: Request): string =>
  ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? "unknown");

// Global cap for all proxied routes. The gateway doesn't authenticate, so
// this can't distinguish logged-in users from anonymous ones — see
// authRateLimiter / paymentRateLimiter below for tighter, route-specific
// limits on the endpoints most worth protecting individually.
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: "Too many requests from this IP, please try again later" },
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator,
});

// Auth endpoints (login, OTP, password reset) are the most common
// brute-force target, so they get a tighter cap than general traffic.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many auth requests from this IP, please try again later" },
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator,
});

// Payment endpoints (including the Razorpay webhook) get a tighter cap too —
// abusive retry loops here carry provider fees and fraud risk.
export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Too many payment requests from this IP, please try again later" },
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator,
});
