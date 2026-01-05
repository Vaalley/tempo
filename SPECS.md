# 📘 Cahier des Charges Technique - Projet "Tempo"

**Titre Visé :** RNCP 37873 (Concepteur Développeur d'Applications)
**Architecture :** Monorepo (Bun Workspaces)

---

## 1. Présentation & Objectifs

**Tempo** est une application SaaS de gestion d'espaces de travail (Flex-office). Elle permet aux collaborateurs de réserver des bureaux ou salles de réunion et aux administrateurs de piloter l'occupation des locaux.

**Objectifs Techniques (Validation RNCP) :**

1.  **Architecture Modulaire (BC02) :** Séparation stricte Front/Back dans un Monorepo.
2.  **Persistance Hybride (BC02) :** Utilisation conjointe de SQL (Données structurées) et NoSQL (Logs/Audit).
3.  **Performance & Modernité :** Utilisation du runtime **Bun** et du framework **Hono**.
4.  **Fullstack Type-Safe :** Communication Front/Back via RPC (Remote Procedure Call).
5.  **DevOps (BC03) :** Conteneurisation complète et pipeline CI/CD automatisé.

---

## 2. Stack Technique Détaillée

| Domaine          | Techno             | Rôle & Justification                                                   |
| :--------------- | :----------------- | :--------------------------------------------------------------------- |
| **Runtime**      | **Bun**            | Exécution JS/TS ultra-rapide, gestionnaire de paquets et Workspaces.   |
| **Monorepo**     | **Bun Workspaces** | Gestion centralisée des dépendances (`apps/backend`, `apps/frontend`). |
| **Backend**      | **Hono**           | Framework Web ultra-léger, performant et compatible Edge.              |
| **Frontend**     | **Svelte 5**       | Framework UI réactif (Runes), sans Virtual DOM.                        |
| **Style**        | **Tailwind CSS**   | Utility-first CSS pour un design rapide et responsive.                 |
| **Base SQL**     | **PostgreSQL**     | Stockage des données métier (Relations fortes, Intégrité).             |
| **ORM SQL**      | **Drizzle ORM**    | Typesafe, léger, performant, génération de migrations SQL.             |
| **Base NoSQL**   | **MongoDB**        | Stockage des logs d'audit (Volume important, structure variable).      |
| **Qualité Code** | **Oxc (Oxlint)**   | Linter haute performance (Rust). Formatage via `.editorconfig`.        |
| **Tests**        | **Vitest**         | Tests unitaires et d'intégration (Natif Vite/Bun).                     |
| **CI/CD**        | **GitHub Actions** | Pipeline d'intégration continue.                                       |
| **Conteneurs**   | **Docker**         | Images optimisées multi-stage (Distroless/Alpine).                     |

---

## 3. Architecture du Monorepo

Structure des dossiers actualisée :

```text
tempo/
├── package.json        # Workspaces: ["apps/*", "packages/*"]
├── bun.lock            # Lockfile unique
├── docker-compose.yml  # Orchestration locale
├── .editorconfig       # Règles de formatage (Tabs 4 spaces)
├── .oxlintrc.json      # Règles de linting
├── apps/
│   ├── backend/        # Hono + Drizzle
│   │   ├── src/
│   │   │   ├── modules/    # Domain Driven Design
│   │   │   │   └── users/  # (route.ts, service.ts, dto.ts)
│   │   │   ├── db/         # (Schema Drizzle, Config Mongo)
│   │   │   └── index.ts    # Point d'entrée serveur & Export Type RPC
│   │   └── Dockerfile
│   └── frontend/       # Svelte 5 + Vite
│       ├── src/
│       │   ├── lib/
│       │   │   └── client.ts # Client RPC Hono
│       │   └── routes/
│       └── Dockerfile
└── README.md
```

---

## 4. Modélisation des Données (BC02)

### 4.1 Base Relationnelle (PostgreSQL + Drizzle)

- **Users (`users`)**
    - `id`: UUID (PK)
    - `email`: Varchar (Unique)
    - `password`: Varchar (Hashed via Bun.password)
    - `role`: Enum ('ADMIN', 'USER')
    - `created_at`: Timestamp

- **Workspaces (`workspaces`)**
    - `id`: Serial (PK)
    - `name`, `capacity`, `type`

- **Bookings (`bookings`)**
    - `id`: UUID (PK)
    - `user_id`, `workspace_id`, `start_at`, `end_at`

### 4.2 Base Documentaire (MongoDB)

- **Collection `AuditLogs`** : Stockage JSON flexible pour l'historique des actions sensibles.

```json
{
  "_id": "ObjectId",
  "action": "DELETE_BOOKING",
  "performed_by": "UUID_USER",
  "timestamp": "ISODate"
}
```

---

## 5. Fonctionnalités & Communication (User Stories)

### Backend (Hono)

- **API RPC :** Le backend exporte un type TypeScript `AppType`. Le frontend l'importe pour avoir l'autocomplétion des routes et des retours.
- **Architecture 3-Tiers :**
    1.  **Route (Controller) :** Validation HTTP et appel de service.
    2.  **Service :** Logique métier pure (Hashing, Règles business).
    3.  **DB (Repository) :** Appels Drizzle/Mongo.

### Frontend (Svelte 5)

- **Runes :** Utilisation de `$state`, `$derived`, `$effect` pour la réactivité.
- **Client Hono :** `const client = hc<AppType>(url)` pour des appels API sûrs.

---

## 6. Stratégie DevOps & Conteneurisation (BC03)

### 6.1 Dockerfiles (Optimisés Bun)

Utilisation de builds multi-stage pour réduire la taille des images.

**Exemple Backend (`apps/backend/Dockerfile`) :**

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
RUN bun install --frozen-lockfile

COPY apps/backend ./apps/backend
WORKDIR /app/apps/backend
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
```

### 6.2 Docker Compose (Production-like)

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    environment:
      DATABASE_URL: "postgres://admin:password123@postgres:5432/tempo_db"
    depends_on: [postgres, mongo]
    ports: ["3000:3000"]

  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
    environment:
      PUBLIC_API_URL: "http://localhost:3000"
    ports: ["5173:3000"]
```

---

## 7. Gestion de Projet & Qualité

- **Méthodologie :** Kanban (Trello).
- **Linting :** `oxlint` (Performance Rust).
- **Formatage :** `.editorconfig` (Indentation Tabs, 4 spaces).
- **Tests :** `bun test` ou `vitest` pour les tests unitaires des services.
