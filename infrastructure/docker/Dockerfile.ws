FROM oven/bun:1.4.2-alpine AS base
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/ws ./apps/ws

RUN bun install --frozen-lockfile

WORKDIR /app/apps/ws
EXPOSE 7070
CMD ["bun", "run", "src/index.ts"]
