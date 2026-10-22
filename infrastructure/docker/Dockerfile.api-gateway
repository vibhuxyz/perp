FROM oven/bun:1.4.2-alpine AS base
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/api-gateway ./apps/api-gateway

RUN bun install --frozen-lockfile

WORKDIR /app/apps/api-gateway
EXPOSE 8080
CMD ["bun", "run", "src/main.ts"]
