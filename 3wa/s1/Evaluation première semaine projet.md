# Evaluation première semaine projet

## 1. Introduction

- **Besoins** : Gérer les espaces flex-office (bureaux, salles, cabines) et permettre aux collaborateurs de les réserver.
- **Cible** : Entreprises pratiquant le flex-office (télétravail partiel, coworking, campus).
- **Contraintes** : Disponibilité dégradée préférable à une indisponibilité totale. Authentification JWT obligatoire. Annulation 24h minimum avant le début. Détection des chevauchements de créneaux.

---

## 2. Besoins fonctionnels « métier »

### 2.1. Utilisateurs du projet

| Rôle | Processus impactés |
|------|--------------------|
| **Collaborateur (USER)** | Consultation, réservation, annulation, check-in |
| **Administrateur (ADMIN)** | Gestion des espaces, supervision des réservations, audit |
| **Système** | Vérification JWT, notifications automatiques, logs d'audit |

L'Administrateur hérite de tous les droits du Collaborateur.

### 2.2. Informations relatives aux contenus

- **Données utilisateurs** : email, mot de passe hashé, rôle — soumises au RGPD
- **Données espaces** : nom, type, capacité, quota max, QR code
- **Données réservations** : créneaux, statut, participants, historique
- **Logs d'audit** : actions sensibles horodatées (MongoDB), non exposées publiquement

Pas de contenu médiatique ni de DRM. Une suppression de compte devra être prévue (RGPD).

### 2.3. Inventaire des besoins fonctionnels

| Fonctionnalité | Collab. | Admin | Description |
|---|:---:|:---:|---|
| S'inscrire / Se connecter / Se déconnecter | ✓ | ✓ | Authentification JWT |
| Consulter et filtrer les espaces | ✓ | ✓ | Par type, capacité, disponibilité |
| Créer une réservation (publique/privée) | ✓ | ✓ | Avec vérification de disponibilité et quota |
| Inviter des collaborateurs | ✓ | ✓ | Invitation par email, statut PENDING/ACCEPTED/DECLINED |
| Consulter ses réservations | ✓ | ✓ | Historique et à venir |
| Annuler sa réservation | ✓ | ✓ | Délai 24h, notification de tous les participants |
| Check-in QR code | ✓ | ✓ | Scanner le QR code de la salle pour confirmer la présence |
| Créer / Modifier / Supprimer un espace | — | ✓ | Suppression avec annulation + notification des réservations futures |
| Consulter toutes les réservations | — | ✓ | Vue globale de l'occupation |
| Tableau de bord & logs d'audit | — | ✓ | Statistiques d'occupation, traçabilité |

---

## 3. UML

### 3.1. Diagramme de cas d'utilisation global

![Diagramme de cas d'utilisation](../../diagrams/use%20case%20diagram.png)

Relations notables :
- `Créer une réservation` **<<include>>** `Vérifier disponibilité` et `Détecter chevauchements`
- `Consulter les espaces` **<<extend>>** `Filtrer par type`
- Admin hérite des droits User (`Admin --|> User`)

### 3.2. Fonctionnalités détaillées

#### 3.2.1. Réservation d'un espace

Le collaborateur filtre les espaces disponibles, choisit un créneau et crée une réservation publique ou privée. Il peut ensuite inviter des collaborateurs. Le système vérifie les chevauchements et le quota.

![Diagramme d'activité](../../diagrams/activity%20diagram%20-%20reservation.png)
![Diagramme de séquence](../../diagrams/sequence%20diagram%20-%20reservation.png)

#### 3.2.2. Annulation d'une réservation

Le collaborateur annule sa réservation (min. 24h avant le début). Le système passe le statut à `CANCELLED` et notifie tous les participants (créateur + invités acceptés).

![Diagramme d'activité](../../diagrams/activity%20diagram%20-%20annulation%20reservation.png)
![Diagramme de séquence](../../diagrams/sequence%20diagram%20-%20annulation%20reservation.png)

#### 3.2.3. Check-in / Suivi de présence

Le collaborateur (créateur ou participant accepté) scanne le QR code dans la salle pendant son créneau. Le système vérifie la correspondance espace/réservation et passe le statut à `CHECKED_IN`. L'action est tracée en audit (MongoDB).

![Diagramme d'activité](../../diagrams/activity%20diagram%20-%20checkin.png)
![Diagramme de séquence](../../diagrams/sequence%20diagram%20-%20checkin.png)

#### 3.2.4. Gestion des espaces (Admin)

L'administrateur crée, modifie ou supprime des espaces. La suppression annule automatiquement les réservations futures et notifie les utilisateurs concernés.

![Diagramme d'activité](../../diagrams/activity%20diagram%20-%20gestion%20espaces%20admin.png)
![Diagramme de séquence](../../diagrams/sequence%20diagram%20-%20gestion%20espaces%20admin.png)

---

## 4. Conception modèle de données

### 4.1. MCD (MERISE)

> _À compléter_

### 4.2. MLD (MERISE)

> _À compléter_

### 4.3. MPD (MERISE)

> _À compléter_

### 4.4. Diagramme de classes (UML)

![Diagramme de classes](../../diagrams/class%20diagram.png)

- **User** : id (UUID), email, password, role (ADMIN|USER), created_at
- **Workspace** : id, name, type, capacity, max_quota, qr_code
- **Booking** : id, user_id (FK), workspace_id (FK), start_at, end_at, status (CONFIRMED|CHECKED_IN|CANCELLED|NO_SHOW), is_public, checked_in_at, cancelled_at, max_attendees
- **BookingInvitation** : id, booking_id (FK), email, status (PENDING|ACCEPTED|DECLINED), created_at

### 4.5. Script de création de la base de données

> _À compléter — généré via `bunx drizzle-kit generate && bunx drizzle-kit migrate`_

### 4.6. Script de création

> _À compléter_

**Argumentation** : Drizzle ORM génère des migrations TypeScript-first versionnées. UUIDs pour les entités métier (anti-énumération).

### 4.7. Script de modification

> _À compléter_

**Argumentation** : Chaque modification de schéma génère un nouveau fichier SQL dans `apps/backend/drizzle/`, permettant un rollback contrôlé.

---

## 5. Environnement technique

| Domaine | Technologie | Justification |
|---------|-------------|---------------|
| Runtime | **Bun** | Ultra-rapide, remplace Node + npm, test runner intégré |
| Backend | **Hono** | Ultra-léger, typage RPC natif (`AppType`) |
| Frontend | **Svelte 5** | Runes (`$state`, `$derived`), sans Virtual DOM |
| Style | **Tailwind CSS 4 + shadcn-svelte** | Utility-first, composants accessibles |
| Base SQL | **PostgreSQL 16 + Drizzle ORM** | Intégrité relationnelle, migrations type-safe |
| Base NoSQL | **MongoDB 7** | Logs d'audit : volume variable, schéma flexible |
| Auth | **JWT (hono/jwt)** | Stateless, sécurisation de toutes les routes |
| Qualité | **Oxlint + EditorConfig** | Linter Rust ultra-rapide, tabs 4, guillemets simples |
| Tests | **Bun Test** (backend) + **Vitest** (frontend) | Intégrés aux runtimes respectifs |
| CI/CD | **GitHub Actions** | Lint + test + build à chaque push |
| Conteneurs | **Docker + Docker Compose** | Multi-stage builds, reproductibilité locale et prod |
| Gestion projet | **Kanban (Trello)** | Suivi simple de l'avancement |

**Ports :** Backend :3000 · Frontend :5173 · PostgreSQL :5432 · MongoDB :27017
