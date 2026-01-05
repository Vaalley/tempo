FROM oven/bun:1 AS base
WORKDIR /app

# Gestion des dépendances
COPY package.json bun.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

RUN bun install --frozen-lockfile

# Copie le code source
COPY apps/frontend ./apps/frontend

# Build du projet SvelteKit
WORKDIR /app/apps/frontend
RUN bun run build

# L'adaptateur Bun sort le build dans le dossier "build/"
EXPOSE 3000
CMD ["bun", "build/index.js"]