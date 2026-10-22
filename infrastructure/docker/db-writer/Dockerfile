FROM oven/bun:1.4.2-alpine AS base
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/engine ./apps/engine
COPY apps/db-writer ./apps/db-writer

RUN bun install --frozen-lockfile

WORKDIR /app/apps/db-writer
CMD ["bun", "run", "src/index.ts"]
