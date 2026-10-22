FROM oven/bun:1.4.2-alpine AS base
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/mark-price-poller ./apps/mark-price-poller

RUN bun install --frozen-lockfile

WORKDIR /app/apps/mark-price-poller
CMD ["bun", "run", "src/index.ts"]
