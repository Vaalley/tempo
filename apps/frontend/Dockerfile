FROM oven/bun:1.3.14-alpine AS development-dependencies

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

RUN bun install --frozen-lockfile

FROM oven/bun:1.3.14-alpine AS build

WORKDIR /app

COPY --from=development-dependencies /app/node_modules ./node_modules
COPY --from=development-dependencies /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=development-dependencies /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/src ./apps/backend/src
COPY apps/frontend ./apps/frontend

RUN bun run --cwd apps/frontend build

FROM oven/bun:1.3.14-alpine AS production-dependencies

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

RUN bun install --frozen-lockfile --production

FROM oven/bun:1.3.14-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=production-dependencies /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=build /app/apps/frontend/build ./apps/frontend/build

WORKDIR /app/apps/frontend
USER bun

EXPOSE 3000

CMD ["bun", "build/index.js"]
