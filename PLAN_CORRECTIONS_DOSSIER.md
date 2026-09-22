# Plan de correction et de finalisation de Tempo

Ce document propose un ordre de travail pour aligner l'application, les diagrammes et le dossier projet. L'objectif n'est pas d'implémenter toute la vision produit initiale, mais de présenter un périmètre cohérent, fonctionnel, testé et démontrable.

## 1. Décision de périmètre à prendre en premier

Le dossier mélange actuellement deux niveaux :

- la **V1 réalisée** : authentification, espaces, réservations publiques ou privées, invitations, participants, check-in par QR code, détection de chevauchement, audit des suppressions et analytique ;
- la **cible future** : entreprises et sites, annulation logique, notifications et règles avancées de quota ou de présence.

Recommandation : finaliser et sécuriser le MVP, puis présenter les fonctions avancées comme une **V2**. Ne conserver comme « réalisé » que ce qui peut être montré dans l'application et prouvé par un test ou une capture.

Créer dans le dossier une matrice de référence :

| Fonctionnalité            | Statut   | Preuve                | Test associé               |
| ------------------------- | -------- | --------------------- | -------------------------- |
| Authentification          | Réalisée | Route, écran, capture | Tests service + route      |
| Réservation simple        | Réalisée | Écran et API          | Tests métier + intégration |
| Modification d'un espace  | Réalisée | Route et écran admin  | Tests DTO + service        |
| Réservation collaborative | Réalisée | Écran et API          | Tests route + intégration  |
| Check-in QR               | Réalisée | Écran, API et QR réel | Tests route + intégration  |

## 2. Priorité critique — sécurité et cohérence métier

Ces corrections doivent précéder la finalisation du dossier, car celui-ci affirme déjà qu'elles existent.

### Autorisations et comptes

- [x] Ajouter un garde `ADMIN` côté backend pour créer et supprimer un espace.
- [x] Ajouter la modification d'un espace et la protéger avec le même garde `ADMIN`.
- [x] Protéger la consultation et la création d'utilisateurs par le rôle `ADMIN`.
- [x] Ne jamais retourner le hash du mot de passe depuis `POST /users`.
- [x] Autoriser un administrateur à annuler la réservation d'un autre utilisateur et appliquer cette règle dans le code, les tests et le dossier.
- [x] Rendre le rôle utilisateur non nul en base.
- [x] Typer correctement `jwtPayload` dans les routes protégées.
- [x] Réserver la gestion des utilisateurs de l'accueil aux administrateurs et afficher un accueil simple aux collaborateurs.

### Secrets et configuration

- [x] Supprimer le secret JWT de secours codé en dur et refuser le démarrage si `JWT_SECRET` manque.
- [x] Sortir les identifiants PostgreSQL/MongoDB de `docker-compose.yml` vers un fichier `.env` non versionné.
- [x] Ajouter des `.env.example` avec uniquement des valeurs factices.
- [x] Restreindre CORS à l'origine du frontend configurée et refuser une configuration absente ou invalide.
- [x] Remplacer le stockage du JWT dans `localStorage` par un cookie `HttpOnly`, `SameSite=Strict` et `Secure` en HTTPS, avec protection CSRF (17 septembre 2026).
- [x] Ajouter des en-têtes de sécurité et un rate limiting configurable sur l'authentification.

### Réservations et données

- [x] Empêcher la réacceptation directe d'une invitation refusée ; imposer une nouvelle invitation ou une participation publique avec contrôle de capacité.
- [x] Refuser une réduction de capacité incompatible avec les participants acceptés ou en attente des réservations en cours/futures.
- [x] Coordonner les admissions et modifications de capacité avec un verrou sur l'espace, puis tester leur concurrence sur PostgreSQL réel.
- [x] Ajouter 12 tests d'intégration de capacité et les inclure dans la commande PostgreSQL de la CI ; voir `docs/CORRECTIONS_CAPACITE_2026-09-15.md` pour les résultats locaux.
- [x] Garantir l'absence de double réservation sous concurrence avec une contrainte d'exclusion PostgreSQL.
- [x] Ajouter les contraintes SQL `end_at > start_at` et `capacity >= 1`.
- [x] Ajouter les index utiles sur les clés étrangères et les créneaux de réservation.
- [x] Corriger l'analytique : une réservation active vérifie `startAt <= now < endAt`.
- [x] Définir le taux d'occupation comme la part des espaces distincts actuellement occupés et plafonner le résultat à 100 %.
- [x] Documenter le comportement actuel de l'audit : échec MongoDB journalisé sans annulation de la suppression PostgreSQL, donc traçabilité en mode best effort dans le MVP.

## 3. Finaliser le périmètre fonctionnel du MVP

### À terminer de préférence

- [x] Ajouter la modification d'un espace pour disposer d'un véritable CRUD.
- [x] Exposer les logs d'audit via une route réservée aux administrateurs.
- [x] Ajouter un écran simple de consultation des logs d'audit.
- [x] Afficher clairement, dans la vue des réservations administrateur, le propriétaire de chaque réservation.
- [x] Renommer cette vue pour l'administrateur afin de ne pas afficher « Mes réservations » lorsqu'il voit toutes les réservations.
- [x] Centraliser les gardes de navigation frontend et traiter proprement les réponses 401/403.
- [x] Utiliser `PUBLIC_API_URL` au lieu d'une URL d'API codée en dur.
- [x] Retirer les conversions `(client as any)` et rétablir le typage Hono RPC réel.

### À implémenter seulement si le temps le permet

- [ ] Filtrage des espaces par type et capacité.
- [ ] Statut de réservation et annulation logique au lieu d'une suppression physique.
- [ ] Disponibilité par créneau.

### Fonctions initialement prévues en V2 et intégrées à la V1

- [x] Réservations publiques/privées.
- [x] Invitations et participants.
- [x] Check-in et QR code.

### À conserver en V2

- [ ] Notifications.
- [ ] Entreprises, sites et multi-tenant.
- [ ] Règles avancées de quota et de présence.

Pour chaque élément V2, conserver éventuellement le diagramme cible, mais écrire explicitement **« conçu, non implémenté dans le MVP »**.

### Sécurité à traiter avant une exposition publique

- [x] Migrer le JWT de `localStorage` vers un cookie `HttpOnly`, `Secure` en HTTPS et `SameSite=Strict`, puis ajouter une protection CSRF et adapter les tests.
- [ ] Remplacer le rate limiting en mémoire par un stockage partagé uniquement si plusieurs instances du backend sont déployées.

## 4. Qualité, typage et tests

### Outillage

- [x] Refaire une installation propre avec `bun install --frozen-lockfile`.
- [x] Faire passer `bun run format:check`, `bun run lint`, `bun run test`, le build et les contrôles TypeScript/Svelte.
- [x] Ajouter un script de type-check backend et l'exécuter dans la CI.
- [x] Corriger l'import du type `@tempo/backend` et déclarer correctement la dépendance workspace du frontend.
- [x] Remplacer les types `any` métier par des types explicites ; les `any` restants sont limités aux mocks de tests historiques et aux utilitaires génériques générés par shadcn-svelte.

### Tests minimums attendus

- [x] Mettre à jour le dossier avec le nombre réel de tests backend : **104 au total**, dont 3 tests d'intégration PostgreSQL et 2 tests d'intégration MongoDB.
- [x] Remplacer le test frontend trivial par des tests utiles : connexion, création de réservation, erreurs, retour sécurisé après connexion et gardes admin (**18 tests frontend**).
- [x] Ajouter des tests de routes HTTP pour les statuts 200/201/400/401/403/404/409.
- [x] Tester spécifiquement les autorisations USER/ADMIN dans le middleware partagé.
- [x] Ajouter un test d'intégration PostgreSQL pour une réservation complète.
- [x] Ajouter des tests d'intégration MongoDB pour l'écriture, l'ordre et le filtrage des logs d'audit.
- [x] Ajouter au moins un parcours E2E : connexion → réservation → consultation → annulation.
- [x] Ajouter un parcours E2E collaboratif : invitation → acceptation → check-in par QR code.
- [x] Ajouter des tests de sécurité ciblés pour CORS, les en-têtes HTTP, la configuration et le rate limiting.
- [x] Ajouter un test d'intégration PostgreSQL lançant deux créations concurrentes et vérifier la traduction du conflit atomique en réponse HTTP 409.

### CI

- [x] Obtenir une exécution GitHub Actions entièrement réussie.
- [x] Vérifier que format, lint, types, tests et recette Docker Compose sont tous obligatoires dans le workflow.
- [x] Ne pas affirmer qu'une fusion est bloquée : la protection de `main` reste volontairement désactivée pendant le développement.
- [x] Remplacer la capture CI en échec par une capture récente réussie.

## 5. Déploiement reproductible

- [x] Utiliser de vrais Dockerfiles multi-stage séparant dépendances, build et runtime.
- [x] Épingler Bun 1.3.14, PostgreSQL 18.6 Alpine 3.24 et MongoDB 8.0.29 Noble.
- [x] Ajouter l'application automatique des migrations lors d'un déploiement neuf.
- [x] Ajouter un jeu de données de démonstration reproductible et idempotent.
- [x] Ajouter des health checks PostgreSQL, MongoDB, backend et frontend.
- [x] Documenter les variables d'environnement obligatoires pour le périmètre actuel.
- [x] Documenter installation, migration, démarrage, vérification, sauvegarde, restauration et rollback.
- [x] Vérifier sur un runner GitHub neuf l'installation, le build et le démarrage Docker décrits dans le README.
- [x] Présenter honnêtement un déploiement local conteneurisé et prouver son exécution sur un runner GitHub disposant de Docker.

## 6. Mise à jour du dossier projet — sections 1 à 6

### Section 1 — Compétences

- [x] Remplacer les consignes du modèle par des preuves personnelles et vérifiables dans les sections rédigées.
- [x] Corriger la description de la compétence « interfaces utilisateur », actuellement proche de celle des composants métier.
- [ ] Ajouter pour chaque compétence les fichiers, tests, captures et difficultés rencontrées.
- [x] Expliquer honnêtement l'architecture réelle : Route → Service → Drizzle/Mongo, sans prétendre disposer d'une couche Repository distincte.
- [ ] Expliquer le choix de programmation fonctionnelle/objets littéraux ou ajouter une réalisation réellement orientée objet si la POO doit être démontrée.
- [x] Corriger les affirmations sur les tests, la base de test, la sauvegarde, les Dockerfiles multi-stage et le CD.
- [x] Ne pas revendiquer de bénéfice mesuré d'éco-conception sans preuve chiffrée.

### Section 2 — Cahier des charges

- [x] Rester impersonnel et déplacer les détails de technologies vers la section 6.
- [ ] Ajouter priorité, statut et critères d'acceptation aux besoins fonctionnels.
- [x] Distinguer MVP et V2.
- [ ] Définir les règles métier temporelles et les principaux scénarios d'erreur.
- [ ] Ajouter des objectifs de performance mesurables et leur protocole de test.
- [ ] Définir les exigences d'accessibilité retenues.
- [ ] Compléter la partie RGPD : finalité, minimisation, conservation, droits et rétention des logs.
- [ ] Remplacer les estimations vagues de budget/charge par les valeurs prévues et réelles.

### Section 3 — Entreprise et service

- [ ] Ajouter la période du projet, ses contraintes et sa proposition de valeur.
- [ ] Définir des objectifs mesurables.
- [ ] Ajouter deux personas courts : Collaborateur et Office Manager.
- [ ] Décrire un processus utilisateur avant/après Tempo.
- [ ] Séparer objectifs atteints et objectifs futurs.

### Section 4 — Gestion de projet

- [ ] Ajouter un planning daté avec jalons et itérations.
- [ ] Comparer prévisionnel et réalisé, puis expliquer les écarts.
- [ ] Ajouter risques, arbitrages, changements de périmètre et décisions techniques.
- [ ] Définir les critères de recette et la « Definition of Done ».
- [x] Insérer les captures existantes de Trello, Git et GitHub Actions.
- [x] Ne pas présenter le script `precommit` comme un hook automatique s'il n'est pas réellement installé.

### Section 5 — Spécifications fonctionnelles

- [x] Renommer 5.4 en « Modélisation des données ».
- [x] Ajouter `/admin/analytics` à la cartographie et décrire la fonctionnalité analytique.
- [x] Corriger la redirection réelle après connexion.
- [x] Insérer la maquette Figma existante et supprimer la phrase affirmant que Figma n'a pas été utilisé.
- [x] Produire un schéma d'architecture 3-tiers « as-built ».
- [x] Distinguer clairement diagrammes cibles et diagrammes correspondant au code actuel.
- [x] Corriger l'attribution des migrations : `0000` pour utilisateurs/espaces, `0001` pour réservations.
- [x] Utiliser la vraie migration `0001` dans la section « script de modification ».
- [x] Pour chaque fonctionnalité détaillée, ajouter préconditions, scénario nominal, erreurs, données, autorisations, endpoints, critères d'acceptation et preuve.
- [x] Retirer ou marquer V2 toute fonctionnalité absente du code.

### Section 6 — Spécifications techniques

- [x] Indiquer les versions réellement utilisées, l'OS, l'IDE et les environnements dev/test/démonstration.
- [x] Ajouter les ports, variables d'environnement et dépendances d'infrastructure.
- [x] Remplacer « CI/CD » par « CI » tant qu'aucun déploiement automatisé n'existe.
- [x] Mettre à jour la liste des routes avec `/admin/analytics`.
- [x] Décrire l'accessibilité réellement testée et la matrice des navigateurs vérifiés.
- [x] Corriger toutes les affirmations de sécurité non encore vraies.
- [x] Documenter les limites restantes : déploiement HTTPS, rate limiting, rotation/révocation des jetons et sauvegardes.
- [x] Passer `<html lang="fr">` et interdire l'indexation si l'application reste interne.

## 7. Nettoyage et preuves du dossier complet

- [ ] Réparer ou remplacer l'image de couverture manquante.
- [ ] Vérifier la date du dossier, actuellement fixée au 7 octobre 2026.
- [ ] Refaire le sommaire avec des ancres Markdown valides.
- [x] Supprimer les anciens intitulés « Exemple 1 : xxx ».
- [ ] Retirer les consignes du modèle et le pied de page parasite.
- [ ] Remplacer tous les textes « Insérer ici… » par une preuve réelle ou supprimer le bloc.
- [ ] Compléter les captures des sections 7 et 10.
- [x] Mettre à jour le plan de tests avec le module `analytics` et les nouveaux tests.
- [x] Produire un compte rendu hebdomadaire synthétique à partir des sections 7 à 10, puis vérifier son export PDF.
- [ ] Rédiger entièrement la section 11 sur la veille sécurité avec sources, fréquence et actions concrètes.
- [ ] Exporter le dossier en PDF et vérifier visuellement chaque page, image, tableau et extrait de code.

## 8. Ordre d'exécution recommandé

1. **Figer le périmètre MVP/V2.**
2. **Corriger sécurité, RBAC, fuite du hash et configuration des secrets.**
3. **Corriger concurrence des réservations et calculs analytiques.**
4. **Terminer le petit périmètre MVP : update espace, audit consultable et nettoyage de l'accueil.**
5. **Rétablir typage, tests, CI et déploiement reproductible.**
6. **Synchroniser les diagrammes et les sections 1 à 6.**
7. **Insérer les preuves et finaliser les sections 7 à 11.**
8. **Faire une recette complète sur un clone neuf, puis produire le PDF final.**

## 9. Définition de « dossier prêt »

Le dossier peut être considéré comme terminé lorsque :

- [x] chaque fonctionnalité présentée comme réalisée est démontrable ;
- [ ] chaque affirmation importante possède une preuve ou un test ;
- [x] les rôles et mesures de sécurité décrits correspondent au code ;
- [x] les diagrammes « as-built » correspondent au schéma et aux routes ;
- [x] les éléments V2 sont explicitement identifiés ;
- [x] format, lint, types, tests, build et CI passent ;
- [x] un environnement neuf peut être installé et migré avec la documentation ;
- [ ] aucun placeholder ou consigne de modèle ne subsiste ;
- [ ] le PDF final a été relu visuellement et orthographiquement.
