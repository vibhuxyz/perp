import cors from "cors";
import { allowedOrigins } from "../config/env.js";

// Built once at startup rather than per-request — the previous version
// constructed a new cors() middleware instance on every single request,
// which is wasteful and non-idiomatic. The `cors` package supports a
// dynamic origin callback natively, so one instance is enough.
export const corsMiddleware = cors({
  credentials: true,
  allowedHeaders: [
    "Authorization",
    "Content-Type",
    "token",
    "x-correlation-id",
    "x-request-id",
    "x-idempotency-key",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  maxAge: 86400,
  origin: (requestOrigin, callback) => {
    if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
      return callback(null, true);
    }
    callback(null, false);
  },
});
