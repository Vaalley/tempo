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
| **CI**         | GitHub Actions     |
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

- [Bun](https://bun.sh) 1.3.14
- [Docker](https://docker.com) avec Docker Compose

## Installation

```bash
# Cloner le repo
git clone https://github.com/Vaalley/tempo.git
cd tempo

# Installer les dépendances (tous les workspaces)
bun install

# Configurer l'environnement local du backend (exécution hors Docker)
cp apps/backend/.env.example apps/backend/.env
```

Les migrations PostgreSQL sont appliquées automatiquement avant le démarrage
du backend. La commande `bun --filter @tempo/backend db:migrate` permet aussi de
les exécuter séparément.

### Configuration de l'environnement

Les fichiers `.env` contiennent des secrets locaux et ne doivent jamais être
commités. Les fichiers `.env.example` sont uniquement des modèles : remplacez
leurs valeurs `change-me` ou `replace-with-...` avant de lancer l'application.

Pour le backend lancé directement avec Bun, copiez
`apps/backend/.env.example` vers `apps/backend/.env`. Il contient les
connexions locales à PostgreSQL/MongoDB et le secret JWT requis :

| Variable                    | Utilisation                                                   |
| --------------------------- | ------------------------------------------------------------- |
| `DATABASE_URL`              | Connexion PostgreSQL                                          |
| `MONGO_URL`                 | Connexion MongoDB                                             |
| `MONGO_DB_NAME`             | Base MongoDB des audits                                       |
| `JWT_SECRET`                | Signature des tokens JWT ; obligatoire                        |
| `FRONTEND_ORIGIN`           | Origine HTTP(S) frontend autorisée par CORS ; obligatoire     |
| `AUTH_RATE_LIMIT_MAX`       | Requêtes d'authentification autorisées par fenêtre            |
| `AUTH_RATE_LIMIT_WINDOW_MS` | Durée de la fenêtre du limiteur en millisecondes              |
| `TRUST_PROXY`               | Prise en compte de `X-Forwarded-For` derrière un proxy fiable |

Pour lancer la stack complète avec Docker Compose, copiez le modèle racine :

```bash
cp .env.example .env
```

Configurez ensuite les identifiants `POSTGRES_*` et `MONGO_INITDB_*`, un
`JWT_SECRET` aléatoire, `FRONTEND_ORIGIN`, ainsi que les URLs listées dans
`.env.example`.
Compose transmettra ces valeurs aux conteneurs ; aucun identifiant n'est
stocké dans `docker-compose.yml`. Si `JWT_SECRET` manque, le backend refuse
de démarrer. Il refuse également une origine frontend absente ou invalide.

`TRUST_PROXY` doit rester à `false` lorsque le backend est exposé directement.
Activez-le uniquement derrière un reverse proxy de confiance qui remplace
`X-Forwarded-For`, sans quoi un client pourrait falsifier son adresse et
contourner le limiteur. Le limiteur actuel est stocké en mémoire : pour
plusieurs instances backend, remplacez-le par un stockage partagé tel que Redis.

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

| Commande                  | Description                                      |
| ------------------------- | ------------------------------------------------ |
| `bun run dev`             | Lance tous les workspaces en mode dev            |
| `bun run build`           | Build tous les workspaces                        |
| `bun run typecheck`       | Vérifie TypeScript et Svelte                     |
| `bun run test`            | Lance les tests unitaires et HTTP                |
| `bun run test:e2e`        | Lance le parcours Playwright dans Chromium       |
| `bun run test:e2e:headed` | Lance le parcours E2E avec le navigateur visible |
| `bun run lint`            | Lint avec Oxlint                                 |
| `bun run format`          | Formate le code                                  |
| `bun run precommit`       | Format + Lint + Types + Tests                    |

## Production (Docker)

```bash
# Construire, démarrer et attendre les health checks
docker compose up --build --detach --wait

# Services disponibles :
# - Backend:   http://localhost:3000
# - Frontend:  http://localhost:5173
# - Postgres:  localhost:5432
# - MongoDB:   localhost:27017
```

Le backend attend PostgreSQL et MongoDB, applique automatiquement toutes les
migrations Drizzle versionnées, puis devient sain sur `/health`. Le frontend
n'est démarré qu'une fois l'API saine.

### Données de démonstration

Renseignez les quatre variables `DEMO_*` du fichier `.env`, puis lancez le seed
idempotent :

```bash
docker compose --profile demo run --build --rm seed
```

Cette commande crée ou remet à jour un compte administrateur, un compte
collaborateur et quatre espaces. Elle peut être rejouée sans dupliquer les
espaces portant les noms de démonstration.

### Vérification

```bash
docker compose ps
curl --fail http://localhost:3000/health
curl --fail http://localhost:5173/
```

La suite d'intégration PostgreSQL applique les migrations, crée une réservation
complète, puis lance deux créations concurrentes sur le même créneau. Elle
vérifie qu'une seule insertion subsiste et que l'autre requête reçoit un conflit
HTTP 409. La suite MongoDB vérifie l'écriture, l'auteur, l'horodatage, l'ordre et
le filtrage des logs d'audit. Les données créées sont supprimées automatiquement :

```bash
docker compose exec --no-TTY backend bun run test:integration:postgres
docker compose exec --no-TTY backend bun run test:integration:mongo
```

Le test E2E Playwright utilise le compte collaborateur et l'espace créés par le
seed. Il vérifie dans Chromium la connexion, la création, l'affichage puis
l'annulation d'une réservation. Installez le navigateur une première fois, puis
exécutez le scénario pendant que la stack et les données de démonstration sont
disponibles :

```bash
npx playwright install chromium
bun run test:e2e
```

Les variables optionnelles `E2E_BASE_URL`, `E2E_API_URL`, `E2E_USER_EMAIL`,
`E2E_USER_PASSWORD` et `E2E_WORKSPACE_NAME` permettent de cibler un autre
environnement. En local, Playwright démarre automatiquement le backend et le
frontend s'ils ne répondent pas déjà ; PostgreSQL, MongoDB et le seed restent des
prérequis. La réservation créée est supprimée même si une assertion ultérieure
échoue.

### Sauvegarde et restauration

Créez le dossier `backups` avant d'exécuter les commandes suivantes :

```bash
# Sauvegarde PostgreSQL
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > backups/tempo-postgres.dump

# Sauvegarde MongoDB
docker compose exec -T mongo sh -c 'mongodump --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --archive' > backups/tempo-mongo.archive

# Restauration PostgreSQL dans une base vide ou compatible
docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' < backups/tempo-postgres.dump

# Restauration MongoDB
docker compose exec -T mongo sh -c 'mongorestore --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --archive' < backups/tempo-mongo.archive
```

### Rollback

Les migrations actuelles sont uniquement ascendantes. Avant toute mise à jour,
effectuez les deux sauvegardes ci-dessus. Pour revenir en arrière, redéployez la
dernière version applicative connue comme stable. Si cette version n'est pas
compatible avec le schéma migré, restaurez également les sauvegardes des deux
bases ; ne tentez pas de modifier manuellement la table de suivi Drizzle.

## Documentation

- [Backend README](./apps/backend/README.md)
- [Frontend README](./apps/frontend/README.md)
- [Cahier des charges](./SPECS.md)

## Licence

MIT
