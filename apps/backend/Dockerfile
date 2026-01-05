FROM oven/bun:1 AS base
WORKDIR /app

# Copie les fichiers de gestion de dépendances du Monorepo
# C'est important de copier la racine aussi pour que les workspaces fonctionnent
COPY package.json bun.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# Installe les dépendances
RUN bun install --frozen-lockfile

# Copie le code source du backend
COPY apps/backend ./apps/backend

# Se place dans le dossier backend
WORKDIR /app/apps/backend

# Expose le port Hono
EXPOSE 3000

# Lance le serveur
CMD ["bun", "run", "src/index.ts"]