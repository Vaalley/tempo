# @tempo/backend

API REST pour Tempo, construite avec **Hono** et **Drizzle ORM**.

## Stack

- **Runtime** : Bun
- **Framework** : Hono
- **ORM** : Drizzle (PostgreSQL)
- **Validation** : Zod
- **Auth** : JWT (hono/jwt)
- **Tests** : Bun Test

## Structure

```
src/
├── index.ts              # Point d'entrée + export AppType (RPC)
├── db/
│   ├── index.ts          # Connexion Drizzle
│   └── schema.ts         # Schémas des tables
├── middlewares/
│   └── auth.guard.ts     # Middleware JWT
└── modules/
    ├── auth/
    │   ├── auth.route.ts
    │   ├── auth.service.ts
    │   ├── auth.dto.ts
    │   └── auth.service.spec.ts
    └── users/
        ├── users.route.ts
        ├── users.service.ts
        └── users.dto.ts
```

## Développement

```bash
# Depuis la racine du monorepo
bun install

# Lancer PostgreSQL
docker compose up -d postgres

# Lancer le serveur (hot reload)
bun run dev
```

Le serveur écoute sur **http://localhost:3000**

## Scripts

| Commande             | Description                      |
| -------------------- | -------------------------------- |
| `bun run dev`        | Lance le serveur avec hot reload |
| `bun run test`       | Lance les tests unitaires        |
| `bun run test:watch` | Tests en mode watch              |
