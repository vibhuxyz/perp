process.on("uncaughtException", (err) => {
  console.error("[Gateway] Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[Gateway] Unhandled Rejection:", reason);
});

import express from "express";
import cookieParser from "cookie-parser";
import dns from "node:dns";

import { ENV } from "@repo/env-config";
import { isProduction, port, upstreamServices } from "./config/env.js";
import { httpsEnforcer } from "./middleware/https-enforcer.js";
import { corsMiddleware } from "./middleware/cors.js";
import { globalRateLimiter } from "./middleware/rate-limiter.js";
import { errorHandler } from "./middleware/error-handler.js";
import { healthRouter } from "./routes/health.js";
import { proxyRouter, REQUEST_ID_HEADER, CORRELATION_ID_HEADER } from "./routes/proxy.js";
import { attachWebSocketProxy } from "./ws/worker-proxy.js";

dns.setDefaultResultOrder("ipv4first");

const app = express();

if (isProduction) {
  app.use(httpsEnforcer);
}

app.use(corsMiddleware);
app.use(cookieParser());
app.set("trust proxy", 1);

// Correlation ID & Request Logging middleware
app.use((req, res, next) => {
  const correlationId =
    (req.headers[CORRELATION_ID_HEADER] as string) ||
    (req.headers[REQUEST_ID_HEADER] as string) ||
    crypto.randomUUID();

  req.headers[CORRELATION_ID_HEADER] = correlationId;
  req.headers[REQUEST_ID_HEADER] = correlationId;
  res.setHeader(CORRELATION_ID_HEADER, correlationId);
  res.setHeader(REQUEST_ID_HEADER, correlationId);

  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[Gateway] ${req.method} ${req.originalUrl || req.url} ${res.statusCode} (${duration}ms)`,
    );
  });

  next();
});

app.use(globalRateLimiter);

app.use(healthRouter);
app.use(proxyRouter);
app.use(errorHandler);

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`[Gateway] Running on http://localhost:${port} [${ENV.NODE_ENV}]`);
  console.log(`[Gateway] Routing to Server: ${upstreamServices.server}`);
  console.log(`[Gateway] WebSocket proxying to: ${upstreamServices.ws.href}`);
});

attachWebSocketProxy(server, upstreamServices.ws);

server.on("error", console.error);

const cleanup = () => {
  try {
    server.close();
  } catch {}
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);


