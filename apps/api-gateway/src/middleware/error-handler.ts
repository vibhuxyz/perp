import type { NextFunction, Request, Response } from "express";

// Terminal error handler. Proxy-layer failures are already handled by
// proxyErrorHandler in routes/proxy.ts; this catches anything thrown
// synchronously elsewhere in the middleware chain so callers always get the
// same { success, message } JSON shape instead of Express's default HTML
// error page. Must be mounted last, after all routes.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error("[Gateway] Unhandled error:", err);
  if (res.headersSent) return;
  res.status(500).json({
    success: false,
    message: "Internal gateway error. Please try again.",
  });
}
