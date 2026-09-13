import type { NextFunction, Request, Response } from "express";

// Redirects plain HTTP to HTTPS and sets HSTS so browsers always use HTTPS.
// Only mounted in production (see main.ts) — local dev has no TLS in front of it.
export function httpsEnforcer(req: Request, res: Response, next: NextFunction): void {
  // Behind a load balancer / reverse proxy (Railway, Render, nginx), the
  // original protocol is in x-forwarded-proto, not req.protocol.
  const proto = (req.headers["x-forwarded-proto"] as string | undefined)
    ?.split(",")[0]
    ?.trim();

  if (proto && proto !== "https") {
    res.redirect(301, `https://${req.headers.host}${req.url}`);
    return;
  }

  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  next();
}
