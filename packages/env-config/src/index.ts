import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const here = path.dirname(fileURLToPath(import.meta.url));

// Repo root first, then anything the process was started with.
config({ path: path.resolve(here, "../../../.env") });
config();

// Server-side only. The browser cannot read process.env — apps/web reads
// import.meta.env through its own config module.
function required(key: string): string {
  const value = process.env[key];

  if (!value) {
    missing.push(key);
    return "";
  }

  return value;
}

const missing: string[] = [];

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",

  API_GATEWAY_PORT: Number(process.env.API_GATEWAY_PORT ?? 8080),
  PORT: Number(process.env.PORT ?? 6000),
  // Not 7000 — macOS ControlCenter binds it for AirPlay Receiver, so the feed dies
  // with EADDRINUSE on a stock Mac before it ever accepts a client.
  WS_PORT: Number(process.env.WS_PORT ?? 7070),

  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  ACCESS_TOKEN_JWT_SECRET_KEY:
    process.env.ACCESS_TOKEN_JWT_SECRET_KEY || process.env.JWT_SECRET || "",
  REFRESH_TOKEN_JWT_SECRET_KEY:
    process.env.REFRESH_TOKEN_JWT_SECRET_KEY || process.env.JWT_SECRET || "",

  CORS_ORIGINS: process.env.CORS_ORIGINS || "",

  // Upstream service URLs for API Gateway
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || `http://localhost:${process.env.PORT ?? 6000}`,
  ORDER_SERVICE_URL: process.env.ORDER_SERVICE_URL || `http://localhost:${process.env.PORT ?? 6000}`,
  MARKET_SERVICE_URL: process.env.MARKET_SERVICE_URL || `http://localhost:${process.env.PORT ?? 6000}`,
  WALLET_SERVICE_URL: process.env.WALLET_SERVICE_URL || `http://localhost:${process.env.PORT ?? 6000}`,
  WS_SERVICE_URL: process.env.WS_SERVICE_URL || `ws://localhost:${process.env.WS_PORT ?? 7070}`,

  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  // 29092 is the host-facing listener in docker-compose.dev.yml; 9092 advertises the
  // broker's internal hostname, which does not resolve outside the compose network.
  KAFKA_BROKERS: (process.env.KAFKA_BROKERS || "localhost:29092").split(","),

  SNAPSHOT_PATH: process.env.SNAPSHOT_PATH || "engine-state.json",
  WEB_URL: process.env.WEB_URL || "http://localhost:5173",
};

// Fail at boot with the whole list rather than one NPE per variable at the
// first request that happens to need it.
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}\n` +
      `Set them in .env at the repo root.`,
  );
}
