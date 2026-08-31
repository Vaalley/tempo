# Tempo

Application SaaS de gestion d'espaces de travail (Flex-office) permettant aux collaborateurs de réserver des bureaux ou salles de réunion.

> **Projet RNCP 37873** - Concepteur Développeur d'Applications

## Stack Technique

| Domaine        | Technologie        |
| -------------- | ------------------ |
| **Runtime**    | Bun                |
| **Monorepo**   | Bun Workspaces     |
| **Backend**    | Hono + Drizzle ORM |
| **Frontend**   | Svelte 5 + Vite    |
| **Base SQL**   | PostgreSQL         |
| **Base NoSQL** | MongoDB            |
| **Style**      | Tailwind CSS       |
| **Tests**      | Bun Test / Vitest  |
| **CI/CD**      | GitHub Actions     |
| **Conteneurs** | Docker             |

## Structure du Monorepo

```
tempo/
├── apps/
│   ├── backend/          # API Hono + Drizzle
│   └── frontend/         # Svelte 5 + Vite
├── packages/             # Librairies partagées (à venir)
├── docker-compose.yml    # Orchestration locale
├── SPECS.md              # Cahier des charges technique
└── README.md
```

## Prérequis

- [Bun](https://bun.sh) >= 1.0
- [Docker](https://docker.com) (pour les bases de données)

## Installation

```bash
# Cloner le repo
git clone https://github.com/Vaalley/tempo.git
cd tempo

# Installer les dépendances (tous les workspaces)
bun install

# Configurer l'environnement local du backend
cp apps/backend/.env.example apps/backend/.env

# Appliquer le schéma PostgreSQL
cd apps/backend
bun run --bun drizzle-kit migrate
cd ../..
```

### Configuration de l'environnement

Les fichiers `.env` contiennent des secrets locaux et ne doivent jamais être
commités. Les fichiers `.env.example` sont uniquement des modèles : remplacez
leurs valeurs `change-me` ou `replace-with-...` avant de lancer l'application.

Pour le backend lancé directement avec Bun, copiez
`apps/backend/.env.example` vers `apps/backend/.env`. Il contient les
connexions locales à PostgreSQL/MongoDB et le secret JWT requis :

| Variable        | Utilisation                            |
| --------------- | -------------------------------------- |
| `DATABASE_URL`  | Connexion PostgreSQL                   |
| `MONGO_URL`     | Connexion MongoDB                      |
| `MONGO_DB_NAME` | Base MongoDB des audits                |
| `JWT_SECRET`    | Signature des tokens JWT ; obligatoire |

Pour lancer la stack complète avec Docker Compose, copiez le modèle racine :

```bash
cp .env.example .env
```

Configurez ensuite les identifiants `POSTGRES_*` et `MONGO_INITDB_*`, un
`JWT_SECRET` aléatoire, ainsi que les URLs listées dans `.env.example`.
Compose transmettra ces valeurs aux conteneurs ; aucun identifiant n'est
stocké dans `docker-compose.yml`. Si `JWT_SECRET` manque, le backend refuse
de démarrer.

## Développement

### Démarrer les bases de données

```bash
docker compose up -d postgres mongo
```

### Lancer le backend et le frontend

```bash
# Lancer tous les workspaces en parallèle
bun run dev

# Ou individuellement
bun --filter @tempo/backend dev   # http://localhost:3000
bun --filter frontend dev         # http://localhost:5173
```

## Scripts disponibles

| Commande            | Description                           |
| ------------------- | ------------------------------------- |
| `bun run dev`       | Lance tous les workspaces en mode dev |
| `bun run build`     | Build tous les workspaces             |
| `bun run test`      | Lance tous les tests                  |
| `bun run lint`      | Lint avec Oxlint                      |
| `bun run format`    | Formate le code                       |
| `bun run precommit` | Format + Lint + Test                  |

## Production (Docker)

```bash
# Build et lancer tous les services
docker compose up --build

# Services disponibles :
# - Backend:   http://localhost:3000
# - Frontend:  http://localhost:5173
# - Postgres:  localhost:5432
# - MongoDB:   localhost:27017
```

## Documentation

- [Backend README](./apps/backend/README.md)
- [Frontend README](./apps/frontend/README.md)
- [Cahier des charges](./SPECS.md)

## Licence

MIT
