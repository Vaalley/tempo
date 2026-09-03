Certification professionnelle

Titre professionnel: **Concepteur développeur d'applications**

RNCP**:** **37873**

DOSSIER PROJET

PROJET :

**Tempo**

Rédacteur :

Valentin Musset

Date : _7 Octobre 2026_

**SOMMAIRE**

1. Liste des compétences du référentiel couvertes par le projet
    1. Développer une application sécurisée
    2. Concevoir et développer une application sécurisée organisée en couches
    3. Préparer le déploiement d'une application sécurisée
2. Cahier des charges
3. Présentation de l'entreprise et du service
4. Gestion de projet
5. Spécifications fonctionnelles
6. Spécifications techniques
7. Réalisations
8. Éléments de sécurité de l'application
9. Plan de tests
10. Jeu d'essai de la fonctionnalité la plus représentative
11. Veille sur les vulnérabilités de sécurité

# 1\. LISTE DES COMPÉTENCES DU RÉFÉRENTIEL COUVERTES PAR LE PROJET

J'ai mobilisé les compétences suivantes pendant la conception, le développement et la mise en service de Tempo. Les éléments cités renvoient à des fichiers, des tests ou des écrans présents dans le dépôt.

## 1.1 Développer une application sécurisée

### 1.1.1. Installer et configurer son environnement de travail en fonction du projet

J'ai organisé Tempo sous la forme d'un monorepo Bun composé d'un backend Hono et d'un frontend SvelteKit. Les commandes communes sont centralisées à la racine pour lancer le développement, les tests, le lint, le formatage et le build. Cette organisation évite de maintenir deux procédures différentes pour les deux applications.

PostgreSQL et MongoDB peuvent être lancés localement ou avec Docker Compose. Les versions de Bun et des images de base sont épinglées pour limiter les écarts entre un poste de développement et le runner GitHub Actions. Les identifiants de base de données et le secret JWT proviennent de fichiers d'environnement ignorés par Git. Les fichiers `.env.example` décrivent uniquement la structure attendue avec des valeurs factices.

Git assure le versionnement. Oxlint et Oxfmt contrôlent la qualité du code, Bun Test et Vitest exécutent les tests unitaires, et Playwright pilote Chromium pour les parcours complets. Le `README.md` regroupe les commandes de démarrage, de migration, de seed, de sauvegarde et de restauration.

### 1.1.2. Développer des interfaces utilisateur

J'ai développé les écrans avec Svelte 5, SvelteKit, Tailwind CSS et les composants shadcn-svelte. Les pages utilisent les runes Svelte pour leurs états locaux. Les formulaires indiquent les chargements et affichent les erreurs retournées par l'API, par exemple lorsqu'un espace est déjà réservé ou qu'une invitation ne peut pas être créée.

L'interface s'adapte au rôle connecté. Un collaborateur ne voit ni les liens ni les actions d'administration. Un administrateur accède à la gestion des utilisateurs et des espaces, aux statistiques, aux audits et à la vue globale des réservations. La page des réservations permet aussi de choisir la visibilité, d'inviter un participant, de répondre à une invitation, de rejoindre une réservation publique et de générer un QR code.

Les appels réseau passent par un client Hono RPC typé avec `AppType`. Les réponses 401 et 403 sont traitées de manière centralisée. Le retour vers la page de check-in après une connexion conserve le jeton QR dans le stockage de session, sans l'ajouter à la requête HTTP vers `/login`. Les tests Vitest et les contrôles Svelte couvrent ces comportements.

### 1.1.3. Développer des composants métier

Le backend est découpé en modules `auth`, `users`, `workspaces`, `bookings`, `analytics` et `audit`. Chaque module sépare les routes HTTP de la logique métier et de l'accès aux données. Les entrées sont validées avec Zod avant d'atteindre les services.

Le module de réservation concentre les règles les plus importantes. Il vérifie les créneaux, traduit les conflits PostgreSQL en réponses HTTP 409, gère la visibilité publique ou privée, les invitations, les participants et la capacité de l'espace. Une transaction verrouille la réservation pendant l'ajout d'un participant afin que deux requêtes simultanées ne dépassent pas la capacité disponible.

Pour le check-in, le serveur génère un jeton aléatoire de 256 bits et n'enregistre que son hash SHA-256. Seul un participant accepté peut confirmer sa présence, pendant le créneau de la réservation. La génération d'un nouveau QR code invalide le précédent. Ces règles sont couvertes par des tests de routes et par un scénario d'intégration sur PostgreSQL réel.

### 1.1.4. Contribuer à la gestion d'un projet informatique

J'ai mené ce projet seul et assuré le cadrage, la conception, le développement, la recette et la préparation du déploiement. Le travail a été découpé dans Trello avec un tableau Kanban, puis suivi à court terme dans `todo.md` et dans le plan de corrections du dossier.

La priorité a d'abord porté sur l'authentification, la création d'espaces et la réservation. Les contrôles d'accès, l'intégrité des données, la CI et les tests d'intégration ont ensuite consolidé ce premier socle. Les réservations publiques ou privées, les invitations, les participants et le check-in par QR code ont été intégrés à la V1 avant la reprise du dossier.

Chaque évolution est vérifiée localement avant l'envoi sur GitHub. La CI rejoue ensuite le formatage, le lint, les types, les tests, les builds et la recette Docker. La branche `main` reste volontairement non protégée pendant le développement, mais le résultat de la CI sert de contrôle avant de poursuivre.

## 1.2. Concevoir et développer une application sécurisée organisée en couches

### 1.2.1. Analyser les besoins et maquetter une application

J'ai commencé par formaliser le besoin dans `SPECS.md`. Le cahier des charges distingue le collaborateur de l'administrateur et délimite les fonctions de réservation, de supervision et d'audit. Les cas d'utilisation et les règles de gestion ont ensuite servi à préparer les modèles de données et les routes de l'API.

Une première maquette Figma a fixé la navigation générale. L'interface a évolué pendant l'implémentation pour tenir compte des composants disponibles et des retours obtenus pendant les tests. La cartographie des pages, la maquette initiale et les diagrammes de comportement figurent en section 5.

### 1.2.2. Définir l'architecture logicielle d'une application

J'ai retenu une architecture en trois couches. SvelteKit gère la présentation, Hono porte les routes et les services métier, tandis que PostgreSQL et MongoDB assurent la persistance. Le frontend et le backend sont deux workspaces du même dépôt. Le type de l'application Hono est partagé avec le client RPC, ce qui permet à TypeScript de détecter une incompatibilité de route ou de données pendant la compilation.

La sécurité est répartie sans être dupliquée. Le frontend adapte la navigation, mais l'API reste responsable des autorisations. Les middlewares vérifient le JWT, le rôle, le CORS, les en-têtes de sécurité et la limite de requêtes. Zod contrôle les entrées. PostgreSQL applique les clés étrangères, les contraintes temporelles et l'exclusion des réservations concurrentes.

Le projet reste un monolithe modulaire adapté à la volumétrie prévue. Les images Docker multi-stage et le runtime commun limitent le nombre de composants à construire et à maintenir. Aucun gain chiffré de consommation n'a été mesuré, donc l'éco-conception est abordée ici par la sobriété de l'architecture et la réduction des services inutiles.

### 1.2.3. Concevoir et mettre en place une base de données relationnelle

J'ai traduit le modèle de données dans le schéma Drizzle puis généré des migrations SQL versionnées. PostgreSQL contient les utilisateurs, les espaces, les réservations, les participants et les hashes des jetons QR. Les clés étrangères et les suppressions en cascade évitent les enregistrements orphelins. Des contraintes supplémentaires garantissent un créneau valide, une capacité positive et l'absence de chevauchement pour un même espace.

Le seed crée deux comptes, plusieurs espaces et une réservation publique avec une invitation en attente. Il est idempotent afin de pouvoir être rejoué dans un environnement de démonstration. Les tests unitaires utilisent des mocks, tandis que les tests d'intégration appliquent les migrations et travaillent sur une base PostgreSQL réelle.

Les volumes Docker conservent les données entre deux démarrages. Le `README.md` documente aussi les commandes `pg_dump` et `pg_restore` nécessaires à une sauvegarde ou à une restauration manuelle.

### 1.2.4. Développer des composants d'accès aux données SQL et NoSQL

Drizzle ORM exécute les opérations SQL et conserve les types du schéma jusqu'aux services. Les créations de réservations et de participants utilisent des transactions. Les recherches relationnelles chargent les espaces, les propriétaires et les participants sans reconstruire ces relations dans le frontend.

MongoDB stocke les audits de suppression. Le service enregistre l'entité supprimée, l'auteur et la date, puis restitue les événements du plus récent au plus ancien. Cet audit fonctionne en mode best effort : un échec MongoDB est journalisé, mais ne revient pas sur une suppression déjà validée dans PostgreSQL.

Les routes convertissent les erreurs métier en statuts HTTP cohérents. Les tests unitaires isolent les services avec des mocks. Les tests d'intégration vérifient la persistance réelle, le conflit de concurrence, le parcours d'invitation et de check-in, ainsi que l'ordre et le filtrage des audits.

## 1.3. Préparer le déploiement d'une application sécurisée

### 1.3.1. Préparer et exécuter les plans de tests d'une application

J'ai organisé les tests en plusieurs niveaux. Les 99 tests backend unitaires et HTTP couvrent les services, les routes, les autorisations et la sécurité. Les 18 tests frontend vérifient l'authentification, le client RPC, les erreurs et les gardes de navigation.

Trois tests PostgreSQL utilisent une base réelle pour contrôler la persistance d'une réservation, le rejet atomique de deux créations concurrentes et le parcours public avec invitation, acceptation puis check-in. Deux tests MongoDB vérifient l'écriture, l'auteur, l'horodatage, l'ordre et le filtrage des audits. Enfin, deux parcours Playwright reproduisent la réservation puis l'annulation, et le parcours collaboratif jusqu'au check-in par QR code.

La section 9 relie chaque groupe de tests aux règles qu'il vérifie. Les résultats locaux sont complétés par la recette GitHub Actions sur une stack Docker neuve.

### 1.3.2. Préparer et documenter le déploiement d'une application

J'ai écrit deux Dockerfiles multi-stage et un fichier `docker-compose.yml` pour PostgreSQL, MongoDB, le backend et le frontend. Compose attend les contrôles de santé des bases. Le backend applique ensuite les migrations avant de démarrer, puis le frontend attend que l'API soit disponible. Un profil optionnel charge le jeu de démonstration.

Le `README.md` décrit la configuration, le lancement, les contrôles de santé, les tests d'intégration, les sauvegardes, la restauration et le retour à une version précédente. Les versions des services sont épinglées et les secrets restent hors du dépôt.

### 1.3.3. Contribuer à la mise en production dans une démarche DevOps

J'ai configuré le workflow `.github/workflows/ci.yml`. Le premier job vérifie le format, le lint, les types, les tests et le build. Le second construit la stack Docker Compose, attend les services, charge le seed et exécute les intégrations PostgreSQL et MongoDB ainsi que les deux parcours Playwright. Les traces, captures et vidéos d'un échec E2E sont conservées comme artefacts pendant sept jours.

L'[exécution du 2 septembre 2026](https://github.com/Vaalley/tempo/actions/runs/33612722369) est entièrement réussie. Les jobs de qualité et de recette Docker sont verts avec les fonctionnalités collaboratives et le check-in de la V1.

![Exécution GitHub Actions réussie avec les jobs Quality et Docker](github-ci.png)

# 2\. CAHIER DES CHARGES

Le cahier des charges décrit le besoin du point de vue métier. Les choix d'implémentation sont détaillés dans les sections 5 et 6.

## 2.1. Description de l'existant

Tempo est un projet personnel de certification, réalisé en dehors de la structure d'alternance. Aucune application antérieure n'est à reprendre.

Le point de départ est l'usage du flex-office sans outil dédié. Un tableur partagé ou un planning général permet de noter une occupation, mais gère mal les accès simultanés, les invitations et la présence réelle. Tempo propose un espace unique pour réserver un bureau ou une salle, inviter des participants et suivre l'occupation.

## 2.2. Reprise de l'existant

Le projet est créé sans code, hébergement, nom de domaine ou documentation hérités. Le cahier des charges `SPECS.md`, les diagrammes, le code et la documentation ont été produits pour Tempo.

## 2.3. Principes de référencement

Tempo est une application métier interne accessible après authentification. Les pages applicatives n'ont pas vocation à apparaître dans les moteurs de recherche. Le document demande donc leur non-indexation, sans considérer cette directive comme un moyen de contrôle d'accès.

## 2.4. Exigences de performances et de volumétrie

La cible de départ est une entreprise de 50 à 300 collaborateurs, sur un ou plusieurs sites. L'usage devrait surtout se concentrer au début et à la fin de la journée de travail.

Les hypothèses de dimensionnement sont les suivantes :

- quelques dizaines d'utilisateurs connectés en même temps ;
- quelques centaines de réservations créées chaque jour ;
- un service disponible pendant les heures ouvrées ;
- un temps de réponse visé inférieur à 300 ms pour la consultation et la réservation.

Cette charge reste compatible avec une application modulaire unique et une base PostgreSQL. Une architecture distribuée ajouterait de l'exploitation sans répondre à un besoin mesuré dans cette première version.

## 2.5. Multilinguisme et adaptations pour un public spécifique

La V1 est disponible uniquement en français. Aucune traduction n'est prévue dans le périmètre actuel.

Les formulaires disposent de libellés associés et les actions principales ont des noms explicites. Aucun audit RGAA ou WCAG complet n'a toutefois été réalisé. L'accessibilité reste donc un chantier identifié, et non une conformité revendiquée.

## 2.6. Description graphique et ergonomique

### 2.6.1. Composants de la charte graphique

Tempo utilise une identité visuelle sobre adaptée à un outil interne. Le nom du produit tient lieu de logotype. La typographie est celle du système et les composants partagent les mêmes tailles, espacements et états.

La palette repose sur les variables CSS de shadcn-svelte et Tailwind CSS. Elle comporte des couleurs neutres, une couleur principale et des variantes pour les alertes ou les actions destructives. Les boutons, cartes, tableaux, badges, champs et messages d'erreur restent cohérents d'un écran à l'autre.

### 2.6.2. Responsive design et ergonomie

Les écrans utilisent les classes adaptatives de Tailwind CSS. L'administration et les tableaux sont principalement destinés à un poste de travail. La création d'une réservation, la réponse à une invitation et le check-in doivent aussi rester utilisables sur mobile.

Le projet privilégie des parcours courts et des libellés directs. Il ne comporte ni animation décorative ni effet de navigation complexe.

## 2.7. Besoins fonctionnels métier

### 2.7.1. Utilisateurs du projet

Deux profils utilisent Tempo :

- le collaborateur `USER` crée un compte, se connecte, consulte les espaces et gère ses réservations. Il peut inviter des personnes, répondre à une invitation, rejoindre une réservation publique et confirmer sa présence ;
- l'administrateur `ADMIN` possède les mêmes fonctions et gère aussi les utilisateurs et les espaces. Il voit toutes les réservations, peut les annuler et consulte les statistiques ainsi que les audits.

Le processus concerné est la gestion des espaces de travail, généralement suivie par les fonctions RH ou Office Management.

### 2.7.2. Informations relatives aux contenus

Tempo ne publie aucun contenu éditorial. L'application traite :

- les comptes, avec l'adresse électronique, le hash du mot de passe et le rôle ;
- les espaces, avec leur nom, leur type et leur capacité ;
- les réservations, avec le créneau, la visibilité et le propriétaire ;
- les participants, avec leur rôle, leur réponse à l'invitation et leur heure éventuelle de check-in ;
- les hashes des jetons QR et leur date d'expiration ;
- les audits de suppression, avec l'entité concernée et l'auteur de l'action.

Ces informations comprennent des données personnelles. Les mots de passe sont hachés, les entrées sont validées et les opérations sensibles sont soumises à une autorisation. Les suppressions font l'objet d'une tentative d'audit.

### 2.7.3. Inventaire des besoins fonctionnels

| Thème         | Acteur                         | Besoin                                         | Règle principale                                                    |
| ------------- | ------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------- |
| Compte        | Collaborateur                  | S'inscrire, se connecter et se déconnecter     | Un compte créé par inscription reçoit le rôle `USER`                |
| Espaces       | Utilisateur connecté           | Consulter les bureaux et salles                | Les écritures sont réservées à l'administrateur                     |
| Espaces       | Administrateur                 | Créer, modifier ou supprimer un espace         | La capacité est un entier supérieur ou égal à 1                     |
| Réservations  | Utilisateur connecté           | Créer une réservation publique ou privée       | Le créneau doit être valide, libre et lié à un espace existant      |
| Réservations  | Propriétaire ou administrateur | Annuler une réservation                        | Un collaborateur ne peut pas supprimer celle d'un autre utilisateur |
| Invitations   | Propriétaire ou administrateur | Inviter un utilisateur déjà inscrit            | Une invitation en attente occupe une place                          |
| Invitations   | Utilisateur invité             | Accepter ou refuser                            | Seul l'utilisateur visé peut répondre                               |
| Participation | Utilisateur connecté           | Rejoindre une réservation publique             | La capacité de l'espace ne doit pas être dépassée                   |
| Check-in      | Participant accepté            | Confirmer sa présence avec le QR code          | Le check-in est possible uniquement pendant le créneau              |
| Supervision   | Administrateur                 | Consulter les réservations et les statistiques | Les routes sont protégées par le rôle `ADMIN`                       |
| Audit         | Administrateur                 | Consulter les suppressions enregistrées        | Les événements sont affichés du plus récent au plus ancien          |

Le filtrage avancé des espaces, le multi-site, les notifications et les quotas plus fins restent hors du périmètre de la V1. Tempo ne comporte ni paiement, ni catalogue commercial, ni moteur de recherche public.

## 2.8. Budget

Aucun budget financier n'a été attribué, puisque Tempo est un projet personnel réalisé en parallèle de l'alternance. Le temps a été réparti entre le cadrage, la conception, le développement du backend et du frontend, les tests, la conteneurisation et la rédaction.

Aucun relevé horaire exhaustif n'a été tenu. Les charges restent donc exprimées de manière qualitative : quelques jours pour le cadrage et la conception, plusieurs semaines pour le développement, puis quelques jours pour les tests, la CI, Docker et la documentation.

# 3\. PRÉSENTATION DE L'ENTREPRISE ET DU SERVICE

## 3.1. Présentation de l'entreprise et du service

Tempo n'est pas développé pour une entreprise existante. C'est un projet personnel mené en autonomie pour couvrir les compétences du titre CDA sur un cas de gestion d'espaces en flex-office.

Le projet est envisagé comme un produit SaaS destiné à des PME. J'ai donc tenu à la fois le rôle du commanditaire pour formaliser le besoin et celui du concepteur développeur pour construire la solution. Cette situation est propre au cadre de certification et ne correspond pas à une commande commerciale réelle.

## 3.2. Objectifs du projet

Tempo doit permettre à un collaborateur de réserver un bureau ou une salle sans conflit, seul ou avec d'autres participants. L'administrateur gère les espaces, les comptes et la vue globale des réservations. Il dispose aussi d'indicateurs d'occupation et d'un historique des suppressions.

Le QR code rapproche la réservation de l'usage réel : un participant accepté confirme sa présence pendant le créneau. Le produit reste une application interne de gestion de ressources, sans fonction de vente.

## 3.3. Cible adressée par le projet

La cible envisagée est une PME ou une ETI de 50 à 300 collaborateurs utilisant le flex-office sur un ou plusieurs sites. Les collaborateurs recherchent surtout un parcours rapide. Les administrateurs et office managers ont besoin d'une vue d'ensemble et d'outils de gestion.

## 3.4. Processus utilisateur impacté

Tempo intervient dans la réservation quotidienne des espaces et dans le suivi de leur occupation. Ce processus relève principalement des fonctions RH et Office Management. Les statistiques peuvent aussi aider à observer l'utilisation des surfaces, sans constituer à elles seules un outil de décision immobilière.

# 4\. GESTION DE PROJET

J'ai organisé le projet et ses contrôles de la manière suivante.

## 4.1. Intervenants sur le projet

J'ai réalisé Tempo seul. J'ai donc pris en charge :

- l'expression du besoin et le cahier des charges ;
- la conception des données, de l'architecture, des diagrammes et des écrans ;
- le développement du backend, du frontend et des migrations ;
- la rédaction et l'exécution des tests ;
- Docker Compose, GitHub Actions et la documentation de déploiement.

Aucun client, chef de projet ou designer extérieur n'est intervenu. Les arbitrages ont été consignés dans les documents du dépôt et dans le suivi des tâches.

## 4.2. Méthodologie

J'ai utilisé une organisation Kanban adaptée à un projet individuel. Trello regroupait les tâches dans les colonnes "À faire", "En cours" et "Terminé". Une carte correspondait à une fonctionnalité ou à un travail technique suffisamment limité pour être vérifié séparément.

Le développement s'est fait par itérations. Une fonctionnalité était codée, testée puis intégrée avant le passage à la suivante. Après le socle fonctionnel, un plan de corrections a servi à traiter les écarts de sécurité, de documentation et de déploiement. Les trois fonctions collaboratives ont ensuite été ramenées dans la V1.

## 4.3. Outils, planning et suivi

Le projet a suivi les étapes suivantes : cadrage, conception, développement du backend, développement du frontend, sécurisation, tests d'intégration, conteneurisation, CI et documentation. Certaines étapes se sont chevauchées, notamment les tests et le développement.

Trello a servi au suivi visuel. Git et GitHub conservent l'historique du code. `todo.md` a regroupé les actions courtes, tandis que `PLAN_CORRECTIONS_DOSSIER.md` a suivi la mise en conformité du projet et du dossier. GitHub Actions fournit un retour après chaque envoi.

![Tableau Kanban du projet dans Trello](trello.png)

![Historique des commits GitHub](github-commits.png)

## 4.4. Objectifs de qualité

Les critères retenus sont vérifiables dans le dépôt :

- les règles métier sont couvertes par 99 tests backend unitaires et HTTP, 3 tests PostgreSQL, 2 tests MongoDB, 18 tests frontend et 2 parcours E2E ;
- Oxlint, Oxfmt, TypeScript et Svelte Check contrôlent le code avant le build ;
- Zod valide les entrées, les mots de passe sont hachés, les routes sont protégées par JWT et les droits sont vérifiés côté API ;
- les modules séparent les routes, les services et la persistance ;
- GitHub Actions reconstruit l'application et exécute la recette Docker sur un environnement neuf.

La CI informe du résultat sans bloquer les envois directs, car la protection de `main` est volontairement désactivée pendant le développement.

# 5\. SPÉCIFICATIONS FONCTIONNELLES

La V1 livrée est décrite ci-dessous à travers ses écrans, ses règles de gestion, ses données et les réponses de l'API.

## 5.1. Contraintes du projet et livrables attendus

### 5.1.1. Criticité de l'application

Tempo est un outil interne utilisé pendant les heures de bureau. Sa criticité est modérée. Une interruption en journée empêche temporairement de consulter ou de créer une réservation, de répondre à une invitation et de confirmer une présence.

La plage de service visée va de 8 h à 19 h, cinq jours sur sept. Le produit cible quelques dizaines à quelques centaines de comptes actifs dans une même entreprise. Aucun engagement contractuel de disponibilité n'est défini pour cette version de démonstration.

### 5.1.2. Applications connexes

Tempo fonctionne de manière autonome. Aucun annuaire, calendrier ou outil RH n'est nécessaire à son fonctionnement. Une connexion SSO ou une synchronisation de calendrier pourrait être ajoutée plus tard, mais ne fait pas partie de la V1.

### 5.1.3. Services tiers

L'application n'utilise ni service d'emailing, ni CRM, ni outil d'analytics externe. GitHub Actions est utilisé uniquement pour la CI. La stack de démonstration reste exécutable en local avec Docker Compose.

### 5.1.4. Livrables attendus

Les livrables sont :

- le cahier des charges `SPECS.md` ;
- les modèles MERISE, les diagrammes UML et la maquette Figma ;
- le backend, le frontend et les migrations versionnés sur GitHub ;
- les tests unitaires, HTTP, frontend, d'intégration et E2E ;
- les Dockerfiles et le fichier `docker-compose.yml` ;
- le workflow GitHub Actions ;
- le seed de démonstration, le `README.md` et le présent dossier.

## 5.2. Architecture logicielle du projet

Tempo suit une architecture en trois couches dans un monorepo Bun.

La présentation repose sur SvelteKit et Svelte 5. Les pages utilisent un client Hono RPC dont les types proviennent du backend. Hono reçoit les requêtes, applique les middlewares, puis appelle les services des modules `auth`, `users`, `workspaces`, `bookings`, `analytics` et `audit`.

PostgreSQL contient les comptes, les espaces, les réservations, les participants et les hashes de jetons QR. MongoDB contient les audits de suppression. Le chemin principal d'un traitement est `Route -> Service -> Drizzle/Mongo`. Il n'existe pas de couche Repository séparée.

Le frontend et le backend disposent chacun d'un Dockerfile multi-stage. Docker Compose les lance avec PostgreSQL et MongoDB.

![Architecture 3-tiers implémentée de Tempo](../diagrams/architecture-as-built.svg)

## 5.3. Maquettes et enchaînement des écrans

### 5.3.1. Cartographie

```text
/                      Accueil après authentification
/login                 Connexion et inscription
/bookings              Réservations, invitations, participants et QR code
/check-in              Validation de présence depuis un QR code
/admin/workspaces      Gestion des espaces, rôle ADMIN
/admin/analytics       Statistiques d'occupation, rôle ADMIN
/admin/audit           Consultation des audits, rôle ADMIN
```

Un visiteur qui tente d'ouvrir une page protégée est redirigé vers `/login`. Après la connexion, l'accueil affiche les fonctions disponibles pour son rôle. Le collaborateur accède à ses réservations, à ses invitations et aux réservations publiques. L'administrateur voit aussi les outils de gestion, les statistiques, les audits et l'ensemble des réservations.

Lorsqu'un utilisateur non connecté scanne un QR code, la destination est conservée dans `sessionStorage` pendant le passage par la page de connexion. Le jeton reste dans le fragment de l'URL et n'est pas envoyé dans la requête initiale au serveur frontend.

### 5.3.2. Maquettes

La [maquette Figma](https://www.figma.com/design/cvMJhj3qr2kSouD2GR3fE8/Tempo?node-id=0-1&t=08qaUd48S0dcjfgZ-1) a servi à fixer la navigation et l'organisation des premiers écrans. L'interface a ensuite évolué avec les composants shadcn-svelte et les fonctions ajoutées à la V1. La maquette montre donc le point de départ, tandis que les captures de l'application représentent le produit livré.

![Maquette Figma de Tempo](figma-design.png)

## 5.4. Modélisation des données

### 5.4.1. MCD (MERISE)

![MCD](../diagrams/merise/MCD.png)

### 5.4.2. MLD (MERISE)

![MLD](../diagrams/merise/MLD.png)

### 5.4.3. MPD (MERISE)

![MPD](../diagrams/merise/MPD.png)

### 5.4.4. Diagramme de classes (UML)

![Diagramme de classes](../diagrams/class%20diagram.png)

Les diagrammes décrivent le modèle cible du projet. La V1 couvre les comptes, les espaces, les réservations publiques ou privées, les participants, les invitations et les QR codes. Le multi-site, les notifications et l'annulation logique restent prévus pour une version ultérieure.

Le schéma réellement exécuté est défini dans `apps/backend/src/db/schema.ts`. Il contient cinq tables PostgreSQL : `users`, `workspaces`, `bookings`, `booking_participants` et `booking_qr_tokens`. MongoDB conserve les audits dans une collection séparée. Les migrations `0000` à `0004` permettent de reconstruire ce modèle.

## 5.5. Création et modification de la base de données

### 5.5.1. Script de création

Drizzle Kit génère les migrations à partir du schéma TypeScript. La migration `0000_gorgeous_vapor.sql` crée les premiers enums, les comptes et les espaces :

```sql
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'USER');
CREATE TYPE "public"."workspace_type" AS ENUM('DESK', 'MEETING_ROOM');

CREATE TABLE "users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" text NOT NULL UNIQUE,
    "password" text NOT NULL,
    "role" "role" DEFAULT 'USER',
    "created_at" timestamp DEFAULT now()
);

CREATE TABLE "workspaces" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "type" "workspace_type" NOT NULL,
    "capacity" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp DEFAULT now()
);
```

La migration `0001_optimal_black_tarantula.sql` ajoute la table des réservations :

```sql
CREATE TABLE "bookings" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "workspace_id" integer NOT NULL,
    "start_at" timestamp NOT NULL,
    "end_at" timestamp NOT NULL,
    "created_at" timestamp DEFAULT now(),
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE
);
```

### 5.5.2. Choix retenus

Drizzle relie le schéma SQL aux types utilisés par les services. Les migrations restent des fichiers SQL versionnés, ce qui permet d'ajouter manuellement les contraintes que le schéma déclaratif ne suffit pas à exprimer.

Les clés étrangères avec `ON DELETE CASCADE` empêchent les réservations ou participants orphelins. L'audit MongoDB intervient après la suppression. Il n'appartient pas à la transaction PostgreSQL et fonctionne donc en mode best effort.

### 5.5.3. Scripts de modification

La migration `0002_booking_overlap_constraint.sql` ajoute les contraintes temporelles :

```sql
CREATE EXTENSION IF NOT EXISTS "btree_gist";

ALTER TABLE "bookings"
ADD CONSTRAINT "bookings_valid_time_range"
CHECK ("end_at" > "start_at");

ALTER TABLE "bookings"
ADD CONSTRAINT "bookings_workspace_time_exclusion"
EXCLUDE USING gist (
    "workspace_id" WITH =,
    tsrange("start_at", "end_at", '[)') WITH &&
);
```

La migration `0003_data_integrity_indexes.sql` renforce les valeurs obligatoires et les index :

```sql
UPDATE "users" SET "role" = 'USER' WHERE "role" IS NULL;
UPDATE "workspaces" SET "capacity" = 1 WHERE "capacity" < 1;

ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "workspaces"
ADD CONSTRAINT "workspaces_capacity_check" CHECK ("capacity" >= 1);

CREATE INDEX "bookings_user_id_idx" ON "bookings" ("user_id");
CREATE INDEX "bookings_workspace_time_idx"
ON "bookings" ("workspace_id", "start_at", "end_at");
```

La migration `0004_booking-collaboration-checkin.sql` ajoute la visibilité, les participants, les statuts d'invitation et les jetons QR. Pendant la migration, chaque propriétaire existant devient un participant `OWNER` avec le statut `ACCEPTED`.

### 5.5.4. Justification des contraintes

Une lecture suivie d'une insertion ne suffit pas à empêcher deux requêtes simultanées de réserver le même espace. La contrainte d'exclusion GiST tranche le conflit dans PostgreSQL. L'intervalle semi-ouvert `[)` autorise une réservation à commencer exactement à l'heure où la précédente se termine. Le backend traduit un conflit SQL en erreur `BOOKING_OVERLAP` et retourne HTTP 409.

La contrainte `CHECK` rejette un créneau vide ou inversé. La migration `0003` rend le rôle obligatoire, impose une capacité minimale et indexe les recherches principales. La migration `0004` empêche qu'un utilisateur apparaisse deux fois dans la même réservation et indexe les recherches par réservation, utilisateur et statut.

L'ajout d'un participant utilise aussi une transaction avec verrouillage de la réservation. La capacité reste ainsi cohérente lorsque plusieurs invitations ou demandes de participation arrivent en même temps.

## 5.6. Diagrammes de comportement

### 5.6.1. Diagramme de cas d'utilisation global (UML)

![Diagramme de cas d'utilisation](../diagrams/use%20case%20diagram.png)

La V1 couvre l'inscription, la connexion, la consultation des espaces, les réservations publiques ou privées, les invitations, les participants, le check-in, l'administration des espaces et des utilisateurs, les statistiques et les audits. Le filtrage avancé et le multi-site ne sont pas encore implémentés.

Le rôle `ADMIN` reprend les droits du collaborateur et ajoute les fonctions de gestion. Un audit est tenté après la suppression d'un espace ou d'une réservation. Le service sait aussi produire un audit utilisateur, mais la V1 ne propose pas de route de suppression de compte.

## 5.7. Fonctionnalités détaillées les plus significatives

### 5.7.1. Fonctionnalité 1 : réserver un espace

Le collaborateur choisit un espace et un créneau, puis définit la réservation comme publique ou privée.

| Élément       | Spécification                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| État          | Livré dans la V1                                                                                                                     |
| Préconditions | Utilisateur connecté et espace existant                                                                                              |
| Interface     | Formulaire de `/bookings`                                                                                                            |
| Endpoint      | `POST /bookings`, rôles `USER` et `ADMIN`                                                                                            |
| Entrées       | `workspaceId`, `startAt`, `endAt`, `visibility`                                                                                      |
| Traitement    | Validation Zod, contrôle de l'espace et du créneau, transaction PostgreSQL, création du participant propriétaire                     |
| Erreurs       | 400 pour des données invalides, 401 sans JWT, 404 si l'espace n'existe pas, 409 en cas de chevauchement                              |
| Acceptation   | La réservation apparaît dans la liste et deux requêtes concurrentes ne peuvent pas occuper le même espace sur le même créneau        |
| Preuves       | `bookings.service.spec.ts`, `http.routes.spec.ts`, `postgres-bookings.integration.spec.ts`, `booking-flow.spec.ts`, migration `0002` |

![Activité de réservation](../diagrams/activity%20diagram%20-%20reservation.png)

![Séquence de réservation](../diagrams/sequence%20diagram%20-%20reservation.png)

L'annulation reste une suppression physique. Le statut d'annulation logique visible dans le modèle cible n'est pas utilisé dans la V1.

### 5.7.2. Fonctionnalité 2 : annuler une réservation

Un collaborateur peut annuler sa propre réservation. Un administrateur peut annuler celle de n'importe quel utilisateur.

| Élément       | Spécification                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| État          | Livré dans la V1                                                                                                  |
| Préconditions | Utilisateur connecté et réservation existante                                                                     |
| Interface     | Action "Annuler" dans `/bookings`                                                                                 |
| Endpoint      | `DELETE /bookings/:id`, propriétaire ou `ADMIN`                                                                   |
| Entrée        | `bookingId` au format UUID                                                                                        |
| Traitement    | Contrôle du droit, suppression PostgreSQL, tentative d'audit MongoDB                                              |
| Erreurs       | 400 pour un identifiant invalide, 401 sans JWT, 403 pour la réservation d'un tiers, 404 si elle n'existe pas      |
| Acceptation   | La réservation disparaît et l'audit contient l'entité supprimée ainsi que l'auteur lorsque MongoDB est disponible |
| Preuves       | `bookings.service.spec.ts`, `http.routes.spec.ts`, `mongo-audit.integration.spec.ts`, `booking-flow.spec.ts`      |

![Activité d'annulation](../diagrams/activity%20diagram%20-%20annulation%20reservation.png)

![Séquence d'annulation](../diagrams/sequence%20diagram%20-%20annulation%20reservation.png)

### 5.7.3. Fonctionnalité 3 : gérer les espaces

| Élément      | Spécification                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| État         | Livré dans la V1                                                                                      |
| Précondition | Compte `ADMIN` connecté pour toute écriture                                                           |
| Interface    | `/admin/workspaces`                                                                                   |
| Endpoints    | `GET /workspaces` pour un utilisateur connecté, puis `POST`, `PATCH` et `DELETE` pour `ADMIN`         |
| Entrées      | `name`, `type` parmi `DESK` et `MEETING_ROOM`, `capacity` supérieure ou égale à 1                     |
| Traitement   | Validation Zod, écriture PostgreSQL et tentative d'audit après une suppression                        |
| Erreurs      | 400 pour des données invalides, 401 sans JWT, 403 pour `USER`, 404 si l'espace n'existe pas           |
| Acceptation  | Le tableau reflète l'opération et un utilisateur standard ne peut effectuer aucune écriture           |
| Preuves      | `workspaces.dto.spec.ts`, `workspaces.service.spec.ts`, `admin.routes.spec.ts`, `http.routes.spec.ts` |

![Activité de gestion des espaces](../diagrams/activity%20diagram%20-%20gestion%20espaces%20admin.png)

![Séquence de gestion des espaces](../diagrams/sequence%20diagram%20-%20gestion%20espaces%20admin.png)

### 5.7.4. Fonctionnalité 4 : effectuer un check-in par QR code

Le propriétaire ou un administrateur génère le QR code. Un participant accepté le scanne pendant le créneau.

| Élément       | Spécification                                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| État          | Livré dans la V1                                                                                                                               |
| Préconditions | Participant accepté, réservation en cours et jeton valide                                                                                      |
| Interfaces    | QR dans `/bookings`, validation dans `/check-in`                                                                                               |
| Endpoints     | `POST /bookings/:id/qr` pour le propriétaire ou `ADMIN`, `POST /bookings/:id/check-in` pour un participant accepté                             |
| Données       | `bookingId`, jeton QR et `checkedInAt`                                                                                                         |
| Traitement    | Génération du jeton, stockage du hash, contrôle du participant et du créneau, enregistrement de l'heure                                        |
| Erreurs       | 403 pour un jeton invalide ou un utilisateur non autorisé, 409 si l'invitation n'est pas acceptée ou si le créneau n'est pas actif             |
| Acceptation   | Une présence est enregistrée uniquement pour la réservation concernée et pendant son créneau                                                   |
| Preuves       | `booking-collaboration.routes.spec.ts`, `postgres-bookings.integration.spec.ts`, `route-guard.spec.ts`, second parcours `booking-flow.spec.ts` |

![Activité de check-in](../diagrams/activity%20diagram%20-%20checkin.png)

![Séquence de check-in](../diagrams/sequence%20diagram%20-%20checkin.png)

### 5.7.5. Fonctionnalité 5 : s'authentifier

| Élément      | Spécification                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| État         | Livré dans la V1                                                                                                         |
| Précondition | Aucune pour l'inscription, compte existant pour la connexion                                                             |
| Interface    | `/login`                                                                                                                 |
| Endpoints    | `POST /auth/register`, `POST /auth/login`                                                                                |
| Entrées      | `email`, `password`                                                                                                      |
| Traitement   | Validation Zod, hash ou vérification avec `Bun.password`, émission d'un JWT valable 24 heures                            |
| Erreurs      | 400 pour des données invalides, 401 pour de mauvais identifiants, 409 si l'adresse existe, 429 si la limite est dépassée |
| Acceptation  | Aucun hash ne quitte l'API et le rôle du JWT détermine l'accès aux routes protégées                                      |
| Preuves      | `auth.service.spec.ts`, `app.security.spec.ts`, `rate-limit.spec.ts`, `auth.svelte.spec.ts`, `booking-flow.spec.ts`      |

Le JWT est conservé dans `localStorage`. Cette limite est décrite dans la section sécurité.

### 5.7.6. Fonctionnalité 6 : consulter les statistiques d'occupation

| Élément      | Spécification                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| État         | Livré dans la V1                                                                                               |
| Précondition | Compte `ADMIN` connecté                                                                                        |
| Interface    | `/admin/analytics`                                                                                             |
| Endpoints    | `GET /analytics/overview`, `GET /analytics/workspaces`                                                         |
| Données      | Comptes, espaces, réservations et heure courante                                                               |
| Calcul       | Une réservation est active si `startAt <= maintenant < endAt`. Le service compte les espaces distincts occupés |
| Erreurs      | 401 sans JWT, 403 pour `USER`, 500 si le calcul échoue                                                         |
| Acceptation  | Le taux global vaut le nombre d'espaces occupés divisé par le nombre total d'espaces, entre 0 et 100 %         |
| Preuves      | `analytics.service.spec.ts`, `admin.routes.spec.ts`, `authorized-api.spec.ts`                                  |

La capacité limite le nombre de participants. L'indicateur d'occupation reste binaire pour chaque espace : une réservation active occupe l'espace entier.

### 5.7.7. Fonctionnalité 7 : consulter les audits

| Élément      | Spécification                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| État         | Livré dans la V1                                                                                            |
| Précondition | Compte `ADMIN` connecté                                                                                     |
| Interface    | `/admin/audit`                                                                                              |
| Endpoint     | `GET /audit?limit=100`, avec une limite comprise entre 1 et 200                                             |
| Données      | Action, entité, données supprimées, date, identifiant, adresse et rôle de l'auteur                          |
| Traitement   | Lecture MongoDB du plus récent au plus ancien                                                               |
| Erreurs      | 400 pour une limite invalide, 401 sans JWT, 403 pour `USER`, 500 si la lecture échoue                       |
| Acceptation  | L'administrateur voit les suppressions, un utilisateur standard ne peut pas ouvrir la page ni appeler l'API |
| Preuves      | `audit.service.spec.ts`, `mongo-audit.integration.spec.ts`, `admin.routes.spec.ts`, `route-guard.spec.ts`   |

### 5.7.8. Fonctionnalité 8 : inviter et gérer les participants

| Élément       | Spécification                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| État          | Livré dans la V1                                                                                                                                     |
| Préconditions | Réservation non terminée, utilisateur invité déjà inscrit et capacité disponible                                                                     |
| Interface     | Actions "Gérer", "Inviter", "Accepter", "Refuser" et "Rejoindre" dans `/bookings`                                                                    |
| Endpoints     | Invitation par le propriétaire ou `ADMIN`, réponse par l'invité, participation directe pour une réservation publique                                 |
| Données       | Rôle `OWNER` ou `GUEST`, statut `PENDING`, `ACCEPTED` ou `DECLINED`, dates de réponse et de check-in                                                 |
| Traitement    | Verrouillage de la réservation, contrôle de capacité, création ou mise à jour du participant                                                         |
| Erreurs       | 403 pour rejoindre une réservation privée, 404 si l'utilisateur n'existe pas, 409 pour un doublon, une capacité atteinte ou une réservation terminée |
| Acceptation   | Une réservation privée reste visible par ses membres. Une réservation publique peut être rejointe sans dépasser la capacité                          |
| Preuves       | `booking-collaboration.routes.spec.ts`, `postgres-bookings.integration.spec.ts`, `authorized-api.spec.ts`, `booking-flow.spec.ts`                    |

# 6\. SPÉCIFICATIONS TECHNIQUES

## 6.1. Référencement

Tempo est une application interne protégée par authentification. Le document HTML déclare `lang="fr"` et contient `<meta name="robots" content="noindex, nofollow">`. Cette balise indique aux moteurs de ne pas indexer les pages. Elle ne protège aucune donnée, ce rôle appartient aux gardes de l'application et de l'API.

## 6.2. Environnement technique

| Domaine            | Version                                   | Usage                                              |
| ------------------ | ----------------------------------------- | -------------------------------------------------- |
| Runtime            | Bun 1.3.14                                | TypeScript, scripts, paquets et workspaces         |
| Backend            | Hono 4.12.24                              | API HTTP, middlewares et RPC typé                  |
| Validation         | Zod 4.4.3                                 | Corps, paramètres et chaînes de requête            |
| Frontend           | Svelte 5.56.3, SvelteKit 2.63.1           | Pages, composants et navigation                    |
| Build              | Vite 7.3.5                                | Développement et production                        |
| Interface          | Tailwind CSS 4.3.0, shadcn-svelte         | Mise en page et composants                         |
| SQL                | Drizzle ORM 0.45.2, Drizzle Kit 0.31.10   | Schéma, requêtes et migrations                     |
| QR code            | qrcode 1.5.4                              | Génération du QR sous forme de Data URL            |
| Base relationnelle | PostgreSQL 18.6, Alpine 3.24              | Comptes, espaces, réservations, participants et QR |
| Base documentaire  | MongoDB 8.0.29, Noble                     | Audits de suppression                              |
| Qualité            | Oxlint 1.68.0, Oxfmt 0.21.0               | Lint et formatage                                  |
| Tests              | Bun Test, Vitest 4.1.8, Playwright 1.57.0 | Tests isolés, intégrations et E2E                  |
| CI                 | GitHub Actions                            | Contrôles qualité et recette Docker                |

La finalisation a été effectuée sous Windows 10 Pro avec PowerShell. Le dépôt ne dépend pas de Codex Desktop ni d'un réglage propre au poste. La CI utilise un runner Ubuntu fourni par GitHub.

| Environnement | Composition                                                                |
| ------------- | -------------------------------------------------------------------------- |
| Développement | Backend et frontend lancés avec Bun, PostgreSQL et MongoDB locaux          |
| Test          | Mocks, bases PostgreSQL et MongoDB réelles, Chromium piloté par Playwright |
| Démonstration | Quatre services Docker Compose et profil optionnel de seed                 |

### 6.2.1. Ports et configuration

| Service            | Port hôte | Port du conteneur |
| ------------------ | --------: | ----------------: |
| PostgreSQL         |      5432 |              5432 |
| MongoDB            |     27017 |             27017 |
| API Hono           |      3000 |              3000 |
| Frontend SvelteKit |      5173 |              3000 |

Les modèles de configuration se trouvent dans `.env.example` et `apps/backend/.env.example`. Les fichiers `.env` réels sont ignorés par Git.

| Groupe                   | Variables                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| PostgreSQL               | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL`                                |
| MongoDB                  | `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD`, `MONGO_URL`, `MONGO_DB_NAME`           |
| Authentification et HTTP | `JWT_SECRET`, `FRONTEND_ORIGIN`, `AUTH_RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_WINDOW_MS`, `TRUST_PROXY` |
| Frontend                 | `PUBLIC_API_URL`                                                                                   |
| Démonstration            | `DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD`, `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`                 |

## 6.3. Navigation et accessibilité

La stack complète se lance avec `docker compose up --build --detach --wait`. Le frontend répond sur `http://localhost:5173` et l'API sur `http://localhost:3000`. Aucun domaine public n'est configuré.

Les routes `/bookings` et `/check-in` demandent un compte connecté. Les pages `/admin/*` demandent aussi le rôle `ADMIN`. Ces contrôles frontend améliorent le parcours, mais les mêmes droits sont vérifiés par l'API.

Les champs disposent de libellés et les boutons importants ont un nom accessible. Svelte Check ne signale aucune erreur ni aucun avertissement. Les deux parcours Playwright sont validés dans Chromium. Aucun audit WCAG complet n'a été mené et les autres moteurs de navigateur n'ont pas été testés.

### 6.3.1. Routes de l'API

| Méthode  | Route                                      | Droit                      | Fonction                                            |
| -------- | ------------------------------------------ | -------------------------- | --------------------------------------------------- |
| `GET`    | `/health`                                  | Public                     | Vérifier que l'API répond                           |
| `POST`   | `/auth/register`                           | Public, limité par adresse | Créer un compte `USER`                              |
| `POST`   | `/auth/login`                              | Public, limité par adresse | Obtenir le JWT et le compte                         |
| `GET`    | `/users`                                   | `ADMIN`                    | Lister les comptes                                  |
| `POST`   | `/users`                                   | `ADMIN`                    | Créer un compte sans renvoyer son hash              |
| `GET`    | `/workspaces`                              | Connecté                   | Lister les espaces                                  |
| `GET`    | `/workspaces/:id`                          | Connecté                   | Consulter un espace                                 |
| `POST`   | `/workspaces`                              | `ADMIN`                    | Créer un espace                                     |
| `PATCH`  | `/workspaces/:id`                          | `ADMIN`                    | Modifier un espace                                  |
| `DELETE` | `/workspaces/:id`                          | `ADMIN`                    | Supprimer et tenter d'auditer                       |
| `GET`    | `/bookings`                                | Connecté                   | Lister les réservations visibles et les invitations |
| `POST`   | `/bookings`                                | Connecté                   | Créer une réservation publique ou privée            |
| `POST`   | `/bookings/:id/invitations`                | Propriétaire ou `ADMIN`    | Inviter un utilisateur                              |
| `PATCH`  | `/bookings/:id/invitations/:participantId` | Utilisateur invité         | Accepter ou refuser                                 |
| `POST`   | `/bookings/:id/join`                       | Connecté                   | Rejoindre une réservation publique                  |
| `POST`   | `/bookings/:id/qr`                         | Propriétaire ou `ADMIN`    | Générer ou renouveler le QR                         |
| `POST`   | `/bookings/:id/check-in`                   | Participant accepté        | Enregistrer la présence                             |
| `DELETE` | `/bookings/:id`                            | Propriétaire ou `ADMIN`    | Supprimer et tenter d'auditer                       |
| `GET`    | `/analytics/overview`                      | `ADMIN`                    | Obtenir les totaux et le taux actuel                |
| `GET`    | `/analytics/workspaces`                    | `ADMIN`                    | Obtenir l'état de chaque espace                     |
| `GET`    | `/audit?limit=100`                         | `ADMIN`                    | Consulter les audits                                |

## 6.4. Services tiers

Aucun service tiers métier n'est appelé. Tempo n'envoie pas d'email et n'utilise ni CRM, ni analytics externe, ni réseau social. GitHub Actions exécute uniquement la CI.

## 6.5. Sécurité

Les rôles `ADMIN` et `USER` sont définis dans PostgreSQL et inclus dans le JWT. `authGuard` vérifie le jeton. `adminGuard` retourne HTTP 403 lorsqu'un utilisateur standard appelle une route d'administration. Les contrôles plus fins, comme la propriété d'une réservation ou l'identité d'un invité, restent dans les services concernés.

Les JWT sont signés en HS256 avec `hono/jwt` et expirent après 24 heures. `JWT_SECRET` est obligatoire au démarrage. Les mots de passe sont hachés avec `Bun.password.hash` et vérifiés avec `Bun.password.verify`. Les réponses de l'API ne contiennent jamais le hash.

Le CORS accepte uniquement `FRONTEND_ORIGIN`. Les en-têtes HTTP ajoutent notamment une politique CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, HSTS et `Permissions-Policy`. Par défaut, l'inscription et la connexion sont limitées à 10 requêtes par adresse sur 15 minutes. La requête suivante reçoit HTTP 429 et un en-tête `Retry-After`.

Zod valide les données avant le service. PostgreSQL complète cette validation avec les clés étrangères, les contraintes `CHECK`, l'unicité des participants et l'exclusion des réservations concurrentes.

Le jeton QR contient 256 bits aléatoires. L'URL le place dans le fragment, puis la page le retire de l'historique avant l'appel API. Si une connexion est nécessaire, la destination passe par `sessionStorage` et non par la chaîne de requête de `/login`. PostgreSQL ne conserve que le hash SHA-256. Le backend vérifie le participant, son statut, le créneau et l'expiration du jeton.

### 6.5.1. Limites connues

- Le JWT est stocké dans `localStorage`. Une faille XSS exécutée dans la page pourrait le lire. Une mise en ligne publique demanderait un cookie `HttpOnly`, `Secure` et `SameSite`, avec une protection CSRF.
- Il n'existe pas de révocation individuelle des JWT ni de rotation automatique du secret.
- Le limiteur est en mémoire. Plusieurs instances backend devraient partager son état.
- Le développement local utilise HTTP. Un déploiement public doit terminer TLS devant l'application.
- Les sauvegardes sont documentées mais ne sont ni planifiées ni externalisées.
- L'audit MongoDB est best effort. Une panne ne revient pas sur une suppression PostgreSQL déjà validée.
- Le QR est commun aux participants d'une réservation. Un utilisateur doit tout de même être connecté, accepté et dans le créneau, mais un participant peut transmettre le code ou effectuer le check-in à distance.

GitHub Actions contrôle le format, le lint, les types, les tests, les builds et Docker Compose. La branche `main` n'est pas protégée, conformément au choix retenu pour la phase de développement.

# 7\. RÉALISATIONS

Les extraits suivants proviennent du code livré. Les fichiers complets restent la source de référence.

## 7.1. Détection des chevauchements

### 7.1.1. Affichage

_(Insérer une capture du message "Ce créneau est déjà réservé pour cet espace" dans la page des réservations.)_

### 7.1.2. Extrait de code

```typescript
async checkOverlap(
    workspaceId: number,
    startAt: Date,
    endAt: Date,
    excludeBookingId?: string,
): Promise<boolean> {
    const conditions = [
        eq(bookings.workspaceId, workspaceId),
        lt(bookings.startAt, endAt),
        gt(bookings.endAt, startAt),
    ];

    const overlapping = await db.query.bookings.findFirst({
        where: excludeBookingId
            ? and(...conditions, ne(bookings.id, excludeBookingId))
            : and(...conditions),
    });

    return !!overlapping;
}
```

### 7.1.3. Argumentation

Deux intervalles se chevauchent lorsque le nouveau début se situe avant la fin existante et que la nouvelle fin se situe après le début existant. Cette condition couvre les intersections partielles, l'inclusion et les créneaux identiques. Deux créneaux consécutifs restent valides.

Le contrôle applicatif fournit une erreur rapide. La contrainte PostgreSQL `bookings_workspace_time_exclusion` reste la garantie finale lorsque deux requêtes arrivent en même temps. Le service reconnaît le code SQL `23P01` et retourne l'erreur métier `BOOKING_OVERLAP`, traduite en HTTP 409.

## 7.2. Authentification et contrôle des rôles

### 7.2.1. Affichage

_(Insérer une capture d'une réponse HTTP 401 et d'une réponse HTTP 403 sur une route protégée.)_

### 7.2.2. Extrait de code

```typescript
export const authGuard = jwt({
    secret: authService.getSecret(),
    alg: 'HS256',
});

export const adminGuard: MiddlewareHandler<AuthEnv> = async (c, next) => {
    const payload = c.get('jwtPayload');

    if (payload.role !== 'ADMIN') {
        return c.json({ error: 'Admin access required' }, 403);
    }

    await next();
};
```

### 7.2.3. Argumentation

`authGuard` vérifie le JWT sur les groupes de routes protégées. `adminGuard` centralise le contrôle d'administration. Une route métier peut ensuite appliquer une règle plus précise avec l'identifiant `sub` du JWT, par exemple vérifier le propriétaire d'une réservation ou l'utilisateur visé par une invitation.

Cette séparation évite de confondre authentification et autorisation. Elle est testée avec un utilisateur standard, un administrateur, un jeton absent et plusieurs routes protégées.

## 7.3. Capacité et concurrence des participants

### 7.3.1. Affichage

_(Insérer une capture du panneau "Participants et QR code" avec une invitation en attente.)_

### 7.3.2. Extrait de code

```typescript
return await db.transaction(async (transaction) => {
    await transaction.execute(
        sql`SELECT "id" FROM "bookings" WHERE "id" = ${bookingId} FOR UPDATE`,
    );

    const booking = await transaction.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
        with: { workspace: true },
    });

    if (!booking) throw new Error('BOOKING_NOT_FOUND');

    const reservedPlaces = await countReservedPlaces(transaction, bookingId);
    if (reservedPlaces >= booking.workspace.capacity) {
        throw new Error('BOOKING_FULL');
    }

    // insertion ou réactivation du participant
});
```

### 7.3.3. Argumentation

Une invitation en attente réserve déjà une place. Sans verrou, deux requêtes pourraient lire la même capacité disponible et ajouter chacune un participant. La transaction verrouille la réservation avec `FOR UPDATE`, recompte les participants non refusés, puis effectue l'écriture.

La même règle est appliquée aux invitations et à la participation directe dans une réservation publique. Le propriétaire est créé comme participant accepté dans la transaction de création de la réservation.

## 7.4. Jeton de check-in et stockage du hash

### 7.4.1. Affichage

_(Insérer une capture du QR code puis de l'écran "Présence confirmée".)_

### 7.4.2. Extrait de code

```typescript
function hashToken(token: string): string {
    return new Bun.CryptoHasher('sha256').update(token).digest('hex');
}

function createToken(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
```

```typescript
if (!participant) throw new Error('PARTICIPANT_NOT_FOUND');
if (participant.invitationStatus !== 'ACCEPTED') {
    throw new Error('INVITATION_NOT_ACCEPTED');
}

const now = new Date();
if (now < participant.booking.startAt) throw new Error('CHECK_IN_TOO_EARLY');
if (now >= participant.booking.endAt) throw new Error('BOOKING_ENDED');
```

### 7.4.3. Argumentation

Le jeton brut est nécessaire dans le QR, mais pas dans la base. Le serveur compare le hash reçu au hash enregistré. Une fuite de la table ne révèle donc pas directement le jeton utilisable. La génération suivante remplace la ligne associée à la réservation et invalide le QR précédent.

Le QR seul ne suffit pas. L'utilisateur doit être connecté, appartenir à la réservation, avoir accepté l'invitation et effectuer l'action pendant le créneau.

## 7.5. Audits MongoDB

### 7.5.1. Affichage

La page `/admin/audit` montre les 100 événements les plus récents avec l'action, l'entité, la date et l'auteur.

_(Insérer une capture de cet écran avec les données de démonstration.)_

### 7.5.2. Extrait de code

```typescript
async logDeletion(
    entityType: AuditLog['entityType'],
    entityId: string | number,
    entityData: Record<string, unknown>,
    performedBy: AuditLog['performedBy'],
): Promise<void> {
    const actionMap: Record<AuditLog['entityType'], AuditAction> = {
        workspace: 'DELETE_WORKSPACE',
        booking: 'DELETE_BOOKING',
        user: 'DELETE_USER',
    };

    await this.log({
        action: actionMap[entityType],
        entityType,
        entityId,
        entityData,
        performedBy,
    });
}
```

### 7.5.3. Argumentation

PostgreSQL contient les données métier structurées. MongoDB reçoit les événements d'audit, dont le contenu peut varier selon l'entité supprimée. Le service conserve l'auteur et l'instant de l'action, puis trie les lectures par date décroissante.

Le choix best effort évite qu'une indisponibilité MongoDB empêche une suppression PostgreSQL. Il implique en contrepartie qu'un événement puisse manquer. Cette limite est documentée et testée.

## 7.6. Client RPC typé

### 7.6.1. Affichage

_(Insérer une capture de l'autocomplétion TypeScript d'une route Hono dans le frontend.)_

### 7.6.2. Extrait de code

```typescript
import { env } from '$env/dynamic/public';
import { hc } from 'hono/client';
import type { AppType } from '@tempo/backend/src/index';

export function createApiClient(apiUrl: string | undefined, options: ApiClientOptions = {}) {
    return hc<AppType>(normalizeApiUrl(apiUrl), {
        headers: options.token ? { Authorization: `Bearer ${options.token}` } : {},
        fetch: options.fetch,
    });
}
```

### 7.6.3. Argumentation

Le frontend importe uniquement le type `AppType`. Hono en déduit les routes, les méthodes, les entrées et les réponses. Une modification incompatible du backend provoque une erreur TypeScript dans le frontend, sans générateur de SDK intermédiaire.

Cette solution est adaptée au monorepo. Elle ne remplace pas la validation à l'exécution, qui reste assurée par Zod et par la lecture contrôlée des réponses HTTP.

# 8\. ÉLÉMENTS DE SÉCURITÉ DE L'APPLICATION

La sécurité repose sur plusieurs contrôles complémentaires :

| Risque                                | Mesure appliquée                                           | Preuve                                          |
| ------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------- |
| Mot de passe exposé                   | Hash avec `Bun.password`, aucun hash renvoyé               | `auth.service.spec.ts`, `users.service.spec.ts` |
| Route appelée sans session            | JWT HS256 avec expiration de 24 heures                     | `auth.guard.spec.ts`, tests de routes           |
| Action d'administration par `USER`    | `adminGuard` et contrôles de rôle                          | `admin.routes.spec.ts`                          |
| Donnée malformée                      | Schémas Zod sur corps, paramètres et requêtes              | Tests DTO et HTTP 400                           |
| Double réservation concurrente        | Exclusion GiST PostgreSQL                                  | Test d'intégration concurrent                   |
| Dépassement de capacité               | Transaction et verrou `FOR UPDATE`                         | Service des participants                        |
| Bruteforce sur l'authentification     | 10 requêtes par adresse sur 15 minutes                     | `rate-limit.spec.ts`                            |
| Appel depuis une origine imprévue     | CORS limité à `FRONTEND_ORIGIN`                            | `app.security.spec.ts`                          |
| Jeton QR lu en base                   | Hash SHA-256 et rotation                                   | Service de check-in                             |
| Jeton QR transmis au serveur frontend | Fragment URL puis `sessionStorage` si connexion            | `route-guard.spec.ts`, E2E                      |
| Secret versionné                      | Variables d'environnement et modèles factices              | `.gitignore`, `.env.example`                    |
| Régression                            | Format, lint, types, tests, builds et recette Docker en CI | GitHub Actions                                  |

Le JWT reste dans `localStorage`. Ce choix simplifie le client RPC, mais expose le jeton à un script exécuté par une faille XSS. Une version publique devrait utiliser un cookie `HttpOnly`, `Secure` et `SameSite`, avec une protection CSRF.

Le limiteur actuel est propre à un processus. Un déploiement horizontal demanderait un stockage partagé. TLS doit aussi être terminé devant l'application. Enfin, l'audit best effort et le QR commun à une réservation sont des compromis connus de la V1.

# 9\. PLAN DE TESTS

## 9.1. Niveaux de test

| Niveau                   | Outil      | Périmètre                                           | Nombre |
| ------------------------ | ---------- | --------------------------------------------------- | -----: |
| Backend unitaire et HTTP | Bun Test   | Services, DTO, middlewares, routes, sécurité        |     99 |
| Frontend unitaire        | Vitest     | Authentification, client RPC, API autorisée, gardes |     18 |
| Intégration PostgreSQL   | Bun Test   | Persistance, concurrence, collaboration et QR       |      3 |
| Intégration MongoDB      | Bun Test   | Écriture, auteur, ordre et filtrage                 |      2 |
| E2E Chromium             | Playwright | Réservation et parcours collaboratif                |      2 |

Les tests d'intégration ne sont pas compris dans les 99 tests backend standards. Le total backend, intégrations comprises, est donc de 104 tests.

## 9.2. Couverture par module

| Module           | Fichiers principaux                                                     | Points contrôlés                                                           |
| ---------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Authentification | `auth.service.spec.ts`, `demo-seed.config.spec.ts`                      | Inscription, connexion, hash, JWT, configuration                           |
| Sécurité HTTP    | `app.security.spec.ts`, `security.config.spec.ts`, `rate-limit.spec.ts` | CORS, en-têtes, origine, limite et HTTP 429                                |
| Autorisations    | `auth.guard.spec.ts`, `admin.routes.spec.ts`                            | HTTP 401, HTTP 403, rôles `USER` et `ADMIN`                                |
| Espaces          | `workspaces.service.spec.ts`, `workspaces.dto.spec.ts`                  | CRUD, capacité et validation PATCH                                         |
| Réservations     | `bookings.service.spec.ts`, `http.routes.spec.ts`                       | Création, visibilité, chevauchement, suppression et statuts HTTP           |
| Collaboration    | `booking-collaboration.routes.spec.ts`                                  | Invitation, réponse, participation publique, droits et fenêtre de check-in |
| Statistiques     | `analytics.service.spec.ts`                                             | Totaux, bornes temporelles et taux                                         |
| Audit            | `audit.service.spec.ts`                                                 | Écriture et lecture MongoDB                                                |
| Frontend         | quatre fichiers `.spec.ts`                                              | Stockage de session, erreurs, client et navigation                         |
| Intégration      | fichiers du dossier `integration`                                       | Bases réelles et migrations                                                |
| E2E              | `e2e/booking-flow.spec.ts`                                              | Deux parcours utilisateur complets                                         |

## 9.3. Environnements et critères de réussite

Les tests unitaires fonctionnent sans base grâce aux mocks. Les intégrations utilisent PostgreSQL et MongoDB réels. Playwright démarre le backend et le frontend puis contrôle Chromium. Le job Docker repart d'une stack neuve, applique les migrations et charge le seed.

Une suite est réussie si aucune assertion n'échoue, si Svelte Check ne produit ni erreur ni avertissement, et si le build de production se termine. Pour l'E2E, les réponses attendues doivent être reçues et les éléments visibles doivent correspondre au parcours. En cas d'échec, Playwright conserve une trace, une capture et une vidéo.

Les vérifications locales ont donné 99 tests backend, 18 tests frontend, 3 intégrations PostgreSQL, 2 intégrations MongoDB et 2 E2E réussis. L'[exécution GitHub Actions du 2 septembre 2026](https://github.com/Vaalley/tempo/actions/runs/33612722369) confirme le même résultat sur la stack Docker du runner.

## 9.4. Évolutions du plan

La couverture actuelle vise les règles fonctionnelles et de sécurité de la V1. Elle ne mesure pas encore les performances sous charge, l'accessibilité complète ou la compatibilité avec Firefox et WebKit. Ces contrôles devront être ajoutés si le produit dépasse le cadre de démonstration.

# 10\. JEU D'ESSAI DE LA FONCTIONNALITÉ LA PLUS REPRÉSENTATIVE

## 10.1. Fonctionnalité retenue

Le parcours retenu est une réservation publique avec invitation, acceptation et check-in par QR code. Il traverse l'authentification, les droits, les transactions PostgreSQL, la capacité de l'espace, la visibilité, la génération du QR et l'interface Svelte. La contrainte de chevauchement reste vérifiée dans le même module.

## 10.2. Scénarios

| Référence | Action                                                           | Résultat attendu                                            |
| --------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| JE1       | Créer une réservation sur un espace existant et un créneau libre | HTTP 201, propriétaire ajouté comme participant accepté     |
| JE2       | Créer la même réservation avec deux requêtes simultanées         | Une seule création réussit, l'autre reçoit HTTP 409         |
| JE3       | Créer une réservation sur un espace inexistant                   | HTTP 404 `WORKSPACE_NOT_FOUND`                              |
| JE4       | Créer un créneau identique ou partiellement chevauchant          | HTTP 409 `BOOKING_OVERLAP`                                  |
| JE5       | Créer un créneau qui commence à la fin du précédent              | HTTP 201, les intervalles sont consécutifs                  |
| JE6       | Inviter un utilisateur existant lorsqu'une place est libre       | HTTP 201, participant `PENDING`                             |
| JE7       | Rejoindre une réservation privée sans invitation                 | HTTP 403                                                    |
| JE8       | Accepter l'invitation avec le compte concerné                    | HTTP 200, statut `ACCEPTED`                                 |
| JE9       | Générer le QR avec le propriétaire ou un administrateur          | HTTP 200, QR généré et jeton utilisable pour la réservation |
| JE10      | Effectuer le check-in avant le début du créneau                  | HTTP 409                                                    |
| JE11      | Effectuer le check-in pendant le créneau avec le bon participant | HTTP 200 et `checkedInAt` enregistré                        |
| JE12      | Annuler avec un autre utilisateur standard                       | HTTP 403                                                    |
| JE13      | Annuler avec le propriétaire ou un administrateur                | HTTP 200 et tentative d'audit                               |

## 10.3. Résultats

| Groupe                                 | Scénarios validés                                 | Résultat |
| -------------------------------------- | ------------------------------------------------- | -------- |
| `bookings.service.spec.ts`             | JE1, JE3, JE4, JE5, JE12, JE13                    | Conforme |
| `booking-collaboration.routes.spec.ts` | JE6, JE7, JE8, JE10                               | Conforme |
| Intégration PostgreSQL                 | JE1, JE2, JE6, JE8, JE9, JE11                     | Conforme |
| E2E réservation                        | JE1 et JE13 depuis l'interface                    | Conforme |
| E2E collaboration                      | JE6, JE8, JE9 et JE11 depuis l'API et l'interface | Conforme |
| Intégration MongoDB                    | Audit de JE13                                     | Conforme |

Les scénarios sont exécutés automatiquement. Les tests PostgreSQL appliquent les migrations avant le parcours et vérifient la valeur de `checkedInAt` en base. Le test E2E se connecte avec les comptes du seed, accepte l'invitation dans l'interface, ouvre l'URL du QR et attend le message "Présence confirmée".

![Exécution réussie du pipeline GitHub Actions](github-ci.png)

_(Insérer ici une capture de l'écran "Présence confirmée".)_

## 10.4. Conclusion

Les scénarios automatisés sont conformes en local et dans GitHub Actions. La contrainte PostgreSQL protège le créneau sous concurrence. La transaction des participants protège la capacité. Le check-in vérifie l'identité, le statut, la réservation, l'heure et le jeton QR.

Ce jeu d'essai valide le parcours fonctionnel le plus complet de la V1. Les limites restantes concernent surtout une utilisation en production publique : stockage du JWT, check-in à distance possible avec un QR partagé, absence de tests de charge et audit MongoDB best effort.

# 11\. VEILLE SUR LES VULNÉRABILITÉS DE SÉCURITÉ

_(Section à rédiger personnellement : décrire ma pratique réelle de veille sécurité — sources suivies (ex : newsletters CERT-FR, blogs sécurité, OWASP, changelogs de sécurité des dépendances npm/Bun), fréquence, et actions concrètes menées sur ce projet, par exemple :_

- _Vérification régulière des vulnérabilités connues dans les dépendances (`bun audit` / Dependabot / GitHub Security Advisories) ;_
- _Application du principe du moindre privilège pour les rôles applicatifs ;_
- _Choix de fonctions de hachage de mot de passe recommandées (Argon2id via `Bun.password`) plutôt que des algorithmes obsolètes ;_
- _Suivi des bonnes pratiques OWASP (validation des entrées, gestion des erreurs sans fuite d'information, expiration des jetons JWT).)_

23 Dossier Projet MUSSET \- VALENTIN ![](Dossier_projet_Valentin_Musset_htm_8a4710a1.png)
