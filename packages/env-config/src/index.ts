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

  PORT: Number(process.env.PORT ?? 6000),
  WS_PORT: Number(process.env.WS_PORT ?? 7000),

  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),

  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  KAFKA_BROKERS: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),

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
