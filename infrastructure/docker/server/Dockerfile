FROM oven/bun:1.4.2-alpine AS base
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/engine ./apps/engine
COPY apps/db-writer ./apps/db-writer
COPY apps/mark-price-poller ./apps/mark-price-poller
COPY apps/ws ./apps/ws
COPY apps/server ./apps/server

RUN bun install --frozen-lockfile

WORKDIR /app/apps/server
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
