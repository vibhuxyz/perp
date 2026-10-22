FROM oven/bun:1.4.2-alpine AS base
WORKDIR /app

COPY package.json bun.lock* turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/server ./apps/server

RUN bun install --frozen-lockfile

WORKDIR /app/apps/server
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
