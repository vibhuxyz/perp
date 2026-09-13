import { ENV } from "@repo/env-config";

export const isProduction = ENV.NODE_ENV === "production";

const defaultLocalOrigins = [3000, 3001, 3002, 3003, 5173, 5174, 8080].flatMap((port) => [
  `http://localhost:${port}`,
  `http://127.0.0.1:${port}`,
]);

if (
  isProduction &&
  (!ENV.CORS_ORIGINS || ENV.CORS_ORIGINS.trim().length === 0)
) {
  console.error("[Gateway] CORS_ORIGINS is required in production.");
  process.exit(1);
}

export const allowedOrigins = [
  ...new Set(
    (ENV.CORS_ORIGINS
      ? [
          ...ENV.CORS_ORIGINS.split(",").map((origin) => origin.trim()),
          ...defaultLocalOrigins,
        ]
      : defaultLocalOrigins
    ).filter(Boolean),
  ),
];

export interface UpstreamServices {
  server: string;
  auth: string;
  order: string;
  market: string;
  wallet: string;
  ws: URL;
}

export const upstreamServices: UpstreamServices = {
  server: `http://localhost:${ENV.PORT || 6000}`,
  auth: ENV.AUTH_SERVICE_URL || `http://localhost:${ENV.PORT || 6000}`,
  order: ENV.ORDER_SERVICE_URL || `http://localhost:${ENV.PORT || 6000}`,
  market: ENV.MARKET_SERVICE_URL || `http://localhost:${ENV.PORT || 6000}`,
  wallet: ENV.WALLET_SERVICE_URL || `http://localhost:${ENV.PORT || 6000}`,
  ws: new URL(ENV.WS_SERVICE_URL || `ws://localhost:${ENV.WS_PORT || 7070}`),
};

export const port = Number(ENV.API_GATEWAY_PORT) || 8080;

