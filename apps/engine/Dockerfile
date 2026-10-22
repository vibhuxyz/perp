FROM oven/bun:1.4.2-alpine AS base
WORKDIR /app

COPY package.json bun.lock* turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/engine ./apps/engine

RUN bun install --frozen-lockfile

WORKDIR /app/apps/engine
CMD ["bun", "run", "src/index.ts"]
