# API Gateway

Single entry point for all client traffic. Terminates CORS, HTTPS/HSTS
enforcement, and rate limiting, then proxies requests to the upstream
services.

## Routing

| Path            | Upstream               | Env var                     |
|-----------------|-------------------------|-----------------------------|
| `/auth`         | auth-service            | `AUTH_SERVICE_URL`          |
| `/product`      | product-service         | `PRODUCT_SERVICE_URL`       |
| `/order`        | order-service           | `ORDER_SERVICE_URL`         |
| `/notification` | notification-service    | `NOTIFICATION_SERVICE_URL`  |
| `/payment`      | payment-service         | `PAYMENT_SERVICE_URL`       |
| WebSocket upgrades | worker-service       | `WORKER_SERVICE_URL`        |

`/gateway-health` returns a basic liveness check.

The worker service is proxied separately from the rest because it needs
WebSocket upgrade support, which `express-http-proxy` (used for the other
five routes) doesn't provide.

## Environment variables

See `env.example` for the full list. `CORS_ORIGINS` and all `*_SERVICE_URL`
variables should be set explicitly in production — the gateway falls back to
`localhost` defaults otherwise, and will refuse to start in production if
`CORS_ORIGINS` is missing.

## Running locally

```
bun install
bun run dev
```

Starts on `API_GATEWAY_PORT` (default `8080`) with `tsx watch`.

## Structure

```
src/
├── main.ts              # boot: wires middleware/routes, starts the server
├── config/env.ts         # env parsing, allowed origins, upstream URLs
├── middleware/           # cors, rate limiting, HTTPS enforcement, error handler
├── routes/                # health check, proxy routes
└── ws/worker-proxy.ts     # WebSocket upgrade proxy for the worker service
```
