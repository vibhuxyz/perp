import { Router } from "express";
import proxy from "express-http-proxy";
import { isProduction, upstreamServices } from "../config/env.js";
import { authRateLimiter } from "../middleware/rate-limiter.js";

export const REQUEST_ID_HEADER = "x-request-id";
export const CORRELATION_ID_HEADER = "x-correlation-id";

const createProxyOptions = (pathRewrite?: (url: string) => string): proxy.ProxyOptions => ({
  parseReqBody: false,
  proxyReqPathResolver: (req) => {
    const targetUrl = req.originalUrl || req.url;
    return pathRewrite ? pathRewrite(targetUrl) : targetUrl;
  },
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    const headers = (proxyReqOpts.headers ?? {}) as Record<string, unknown>;

    const requestId =
      srcReq.headers[REQUEST_ID_HEADER] ||
      srcReq.headers[CORRELATION_ID_HEADER] ||
      crypto.randomUUID();

    headers[REQUEST_ID_HEADER] = requestId;
    headers[CORRELATION_ID_HEADER] = requestId;

    if (srcReq.headers.token) {
      headers["token"] = srcReq.headers.token;
    }
    if (srcReq.headers.authorization) {
      headers["authorization"] = srcReq.headers.authorization;
    }

    proxyReqOpts.headers = headers as typeof proxyReqOpts.headers;
    return proxyReqOpts;
  },
  userResHeaderDecorator: (headers, _userReq, userRes, _proxyReq, proxyRes) => {
    if (proxyRes.headers["set-cookie"]) {
      userRes.setHeader("set-cookie", proxyRes.headers["set-cookie"]);
    }
    if (isProduction) {
      headers["strict-transport-security"] =
        "max-age=31536000; includeSubDomains; preload";
    }
    return headers;
  },
  proxyErrorHandler: (err, res, _next) => {
    const code = (err as NodeJS.ErrnoException)?.code;
    console.error("[Gateway] Upstream proxy error:", code || "", err?.message || err);
    if (res.headersSent) return;

    const isTimeoutOrReset =
      code === "ETIMEDOUT" ||
      code === "ESOCKETTIMEDOUT" ||
      code === "ECONNRESET" ||
      code === "EPIPE";

    if (isTimeoutOrReset) {
      return res.status(504).json({
        success: false,
        message: "The upstream request timed out or connection was reset. Please try again.",
      });
    }

    res.status(502).json({
      success: false,
      message: "Upstream service temporarily unavailable. Please try again.",
    });
  },
});

export const proxyRouter: Router = Router();

// Auth routes (support both /api/auth and /auth with rate limiting)
proxyRouter.use("/api/auth", authRateLimiter, proxy(upstreamServices.auth, createProxyOptions()));
proxyRouter.use("/auth", authRateLimiter, proxy(upstreamServices.auth, createProxyOptions((url) => `/api${url}`)));

// Dedicated service routes
proxyRouter.use("/api/order", proxy(upstreamServices.order, createProxyOptions()));
proxyRouter.use("/order", proxy(upstreamServices.order, createProxyOptions((url) => `/api${url}`)));

proxyRouter.use("/api/market", proxy(upstreamServices.market, createProxyOptions()));
proxyRouter.use("/market", proxy(upstreamServices.market, createProxyOptions((url) => `/api${url}`)));

proxyRouter.use("/api/wallet", proxy(upstreamServices.wallet, createProxyOptions()));
proxyRouter.use("/wallet", proxy(upstreamServices.wallet, createProxyOptions((url) => `/api${url}`)));

// API v1 versioned routes
proxyRouter.use("/api/v1", proxy(upstreamServices.server, createProxyOptions()));

// Catch-all API and admin routes
proxyRouter.use("/api", proxy(upstreamServices.server, createProxyOptions()));
proxyRouter.use("/admin", proxy(upstreamServices.server, createProxyOptions()));

