FROM oven/bun:1.3.14-alpine AS dependencies

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

RUN bun install --frozen-lockfile --production

FROM oven/bun:1.3.14-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/backend/node_modules ./apps/backend/node_modules
COPY package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/drizzle ./apps/backend/drizzle

WORKDIR /app/apps/backend
USER bun

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
