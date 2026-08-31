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

# Configurer l'environnement backend
cp apps/backend/.env.example apps/backend/.env

# Lancer PostgreSQL
docker compose up -d postgres

# Lancer le serveur (hot reload)
bun --filter @tempo/backend dev
```

Le serveur écoute sur **http://localhost:3000**

Le point d'entrée applique les migrations Drizzle automatiquement avant
d'ouvrir le serveur. Pour les exécuter sans démarrer l'API :

```bash
bun --filter @tempo/backend db:migrate
```

`apps/backend/.env.example` documente les connexions, `JWT_SECRET`, l'origine
frontend autorisée et le rate limiting. Copiez-le vers `.env`, puis remplacez
les valeurs d'exemple avant de démarrer le serveur. Le backend échoue
explicitement au démarrage si `JWT_SECRET` ou `FRONTEND_ORIGIN` est absent ou
invalide.

Les variables `DEMO_*` ne sont lues que par `db:seed`. Elles doivent être
renseignées explicitement avant de charger les données de démonstration.

Les routes `/auth/login` et `/auth/register` partagent par défaut une limite de
10 requêtes par adresse sur 15 minutes. `TRUST_PROXY` doit rester à `false`, sauf
derrière un proxy de confiance qui écrase `X-Forwarded-For`. Ce limiteur est en
mémoire et convient au MVP mono-instance ; un déploiement horizontal nécessite
un stockage partagé.

## Scripts

| Commande                            | Description                                              |
| ----------------------------------- | -------------------------------------------------------- |
| `bun run dev`                       | Lance le serveur avec hot reload                         |
| `bun run start`                     | Lance le serveur en mode normal                          |
| `bun run typecheck`                 | Vérifie les sources TypeScript                           |
| `bun run db:migrate`                | Applique les migrations PostgreSQL                       |
| `bun run db:seed`                   | Charge les comptes et espaces de démonstration           |
| `bun run test`                      | Lance les tests unitaires et HTTP                        |
| `bun run test:integration:postgres` | Teste les migrations et réservations sur PostgreSQL réel |
| `bun run test:watch`                | Tests en mode watch                                      |

Le test d'intégration nécessite `DATABASE_URL`. Il crée des données portant des
identifiants uniques et les supprime après chaque scénario. Il est exécuté dans
le job Docker de la CI, une fois PostgreSQL sain et les migrations appliquées.
