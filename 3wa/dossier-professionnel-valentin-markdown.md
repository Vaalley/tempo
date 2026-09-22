# Dossier professionnel

Nom de naissance : Musset

Nom d’usage : Musset

Prénom : Valentin

Adresse : 23 rue Louis Joxe, 44200, Nantes

Titre professionnel visé : Concepteur développeur d’applications (RNCP 37873)

Modalité d’accès : Parcours de formation

☐ Parcours de formation
☐ Validation des Acquis de l’Expérience (VAE)

> Version de travail relue le 21 septembre 2026 à partir du dossier projet et du dépôt Tempo. Les exemples reprennent les réalisations documentées. Avant remise, le candidat doit confirmer ses interventions personnelles, préciser les aides utilisées, compléter les périodes et relire la déclaration sur l’honneur. Les résultats de la recette assistée sont distingués de ses propres interventions.

Présentation du dossier

Le dossier professionnel (DP) constitue un élément du système de validation du titre professionnel.
Ce titre est délivré par le Ministère chargé de l’emploi.
Le DP appartient au candidat. Il le conserve, l’actualise durant son parcours et le présente obligatoirement à chaque session d’examen.
Pour rédiger le DP, le candidat peut être aidé par un formateur ou par un accompagnateur VAE.
Il est consulté par le jury au moment de la session d’examen.

Pour prendre sa décision, le jury dispose : 1. des résultats de la mise en situation professionnelle complétés, éventuellement, du questionnaire professionnel ou de l’entretien professionnel ou de l’entretien technique ou du questionnement à partir de productions.

    2. du Dossier Professionnel (DP) dans lequel le candidat a consigné les preuves de sa pratique professionnelle.

    3. des résultats des évaluations passées en cours de formation lorsque le candidat évalué est issu d’un parcours de formation

    4. de l’entretien final (dans le cadre de la session titre).

    	[Arrêté du 22 décembre 2015, relatif aux conditions de délivrance des titres professionnels

du ministère chargé de l’Emploi]

Ce dossier comporte :
• pour chaque activité-type du titre visé, un à trois exemples de pratique professionnelle ;
• un tableau à renseigner si le candidat souhaite porter à la connaissance du jury la détention d’un titre, d’un diplôme, d’un certificat de qualification professionnelle (CQP) ou des attestations de formation ;
• une déclaration sur l’honneur à compléter et à signer ;
• des documents illustrant la pratique professionnelle du candidat (facultatif)
• des annexes, si nécessaire.
Pour compléter ce dossier, le candidat dispose d’un site web en accès libre sur le site.
 http://travail-emploi.gouv.fr/titres-professionnels

# Sommaire

1. Développer une application sécurisée : réaliser les réservations et leurs contrôles d’accès.
2. Concevoir et développer une application sécurisée organisée en couches : organiser les données et les traitements SQL/NoSQL.
3. Préparer le déploiement d’une application sécurisée : préparer les tests et la livraison de Tempo.
4. Titres, diplômes, CQP et attestations de formation.
5. Déclaration sur l’honneur.
6. Documents illustrant la pratique professionnelle et annexes.

La pagination sera renseignée après l’export final.

# Exemples de pratique professionnelle

## Activité-type 1 : Développer une application sécurisée

### Exemple n° 1 : Réaliser les réservations et leurs contrôles d’accès dans Tempo

### 1. Décrivez les tâches ou opérations que vous avez effectuées, et dans quelles conditions

Tempo est mon projet personnel de certification, réalisé en dehors de ma structure d’alternance. J’ai développé une application de réservation de bureaux et de salles. Le collaborateur réserve un espace et gère ses participations. L’administrateur gère les espaces et consulte toutes les réservations.

J’ai construit les écrans avec SvelteKit, Svelte 5 et shadcn-svelte. Un formulaire transmet l’espace, le créneau et la visibilité à l’API Hono. Les routes valident les entrées avec Zod, puis appellent les services métier. L’API vérifie la session et les droits, indépendamment des actions visibles dans l’interface.

La version actuelle utilise un cookie HttpOnly pour la session. Le frontend conserve le compte en mémoire et le recharge au démarrage. Les mutations exigent l’origine autorisée et un en-tête de protection CSRF.

Le contrôle de capacité compte le propriétaire, les participants acceptés et les invitations en attente. Une admission verrouille l’espace, puis la réservation, avant de recompter les places. Cette coordination empêche qu’une invitation et une réduction de capacité créent un état incohérent. Le check-in exige un jeton QR valide, une participation acceptée et un créneau en cours.

### 2. Précisez les moyens utilisés

SvelteKit, Svelte 5, Tailwind CSS et shadcn-svelte pour les écrans ; Bun, Hono, Zod et le client RPC typé pour l’API ; PostgreSQL et Drizzle pour les données. Les tests utilisent Bun Test, Vitest et Playwright.

Les routes et services du module `bookings`, le garde d’authentification et les tests de session sont les fichiers de référence.

### 3. Avec qui avez-vous travaillé ?

Le projet a été mené seul, avec un léger accompagnement de mon tuteur en entreprise et les formateurs de la 3WA.

### 4. Contexte

Nom de l’entreprise, organisme ou association : Collectif Energie ; projet personnel Tempo ; Ecole 3WAcademy.

Chantier, atelier, service : interface, réservations et contrôles d’accès.

Période d’exercice : du 5 Janvier 2026 au 22 Septembre 2026.

### 5. Informations complémentaires (facultatif)

/

## Activité-type 2 : Concevoir et développer une application sécurisée organisée en couches

### Exemple n° 1 : Organiser les données et les traitements SQL/NoSQL de Tempo

### 1. Décrivez les tâches ou opérations que vous avez effectuées, et dans quelles conditions

J’ai formalisé le besoin dans les spécifications, préparé une maquette Figma et produit des modèles UML et MERISE. La conception initiale comprenait des entreprises, des quotas et des notifications. La V1 développée couvre les comptes, les espaces, les réservations, les participants et les jetons QR.

J’ai organisé le backend en modules. Les routes traitent les requêtes HTTP et les erreurs. Les services portent les règles métier et accèdent aux données avec Drizzle ou le pilote MongoDB. Le dépôt ne contient pas de couche Repository distincte.

La base relationnelle comporte cinq tables. Les clés étrangères relient chaque réservation à un propriétaire et à un espace. Une contrainte d’exclusion PostgreSQL empêche les chevauchements, y compris lorsque deux requêtes arrivent en même temps. Les créneaux sont semi-ouverts : une réservation peut commencer à l’heure exacte où la précédente se termine.

Chaque participant possède une ligne avec son statut d’invitation et son heure de check-in. Le serveur conserve le hash du jeton QR, pas sa valeur brute. MongoDB reçoit les audits de suppression avec l’entité, l’auteur et la date. L’audit est best effort : une panne MongoDB n’annule pas une suppression déjà validée dans PostgreSQL.

Les diagrammes et le code présentent encore des différences. Les rôles et types d’espace sont des enums, les invitations sont intégrées aux participants et un seul hash QR est conservé par réservation. Les modèles décrivent un statut global de check-in et une annulation logique, absents du code.

### 2. Précisez les moyens utilisés

Modèles MERISE conservés dans Looping, diagrammes UML, maquette Figma, schéma Drizzle, migrations SQL, pilote MongoDB et tests de persistance.

Le schéma `apps/backend/src/db/schema.ts` et les migrations décrivent la base exécutée. Les services sont principalement des objets littéraux et des fonctions ; le diagramme de classes représente une conception, pas une implémentation sous forme de classes.

### 3. Avec qui avez-vous travaillé ?

Projet personnel réalisé en autonomie. Avec l'aide des formateurs de la 3WA et mon tuteur en entreprise.

### 4. Contexte

Nom de l’entreprise, organisme ou association : Collectif Energie ; projet personnel Tempo ; Ecole 3WAcademy.

Chantier, atelier, service : conception des données, architecture et accès SQL/NoSQL.

Période d’exercice : du 5 Janvier 2026 au 22 Septembre 2026.

### 5. Informations complémentaires (facultatif)

Les entreprises, les sites, les notifications et les quotas avancés restent hors de la V1.

La classe `ApiError`, qui hérite de `Error`, illustre l’utilisation de la programmation orientée objet dans Tempo. Elle associe un message à un statut HTTP et permet un traitement spécifique des erreurs d’authentification et d’autorisation.

## Activité-type 3 : Préparer le déploiement d’une application sécurisée

### Exemple n° 1 : Préparer les tests et la livraison reproductible de Tempo

### 1. Décrivez les tâches ou opérations que vous avez effectuées, et dans quelles conditions

J’ai préparé deux Dockerfiles multi-stage et une configuration Docker Compose pour le frontend, le backend, PostgreSQL et MongoDB. Le backend applique les migrations avant de démarrer. Un seed crée les comptes et espaces de démonstration. Les variables sont décrites dans des fichiers d’exemple ; les secrets réels ne sont pas versionnés.

J’ai organisé les tests par niveau : services et routes, frontend, intégrations PostgreSQL et MongoDB, puis parcours navigateur. Le workflow GitHub Actions prévoit le formatage, le lint, les types et le build, suivis d’une recette Docker. Les traces des échecs Playwright sont conservées comme artefacts.

Tous les tests backend, tests frontend, tests PostgreSQL et parcours Chromium réussis en local. Les types, le lint, le formatage et le build ont aussi réussi.

Le README décrit le démarrage, les migrations, la sauvegarde, la restauration et le retour arrière.

### 2. Précisez les moyens utilisés

Docker Compose, Dockerfiles, Git, GitHub Actions, commandes Bun, Bun Test, Vitest, Playwright et bases dédiées aux intégrations.

### 3. Avec qui avez-vous travaillé ?

Projet personnel réalisé en autonomie. Avec l'aide des formateurs de la 3WA et mon tuteur en entreprise.

### 4. Contexte

Nom de l’entreprise, organisme ou association : Collectif Energie ; projet personnel Tempo ; Ecole 3WAcademy.

Chantier, atelier, service : préparation de la livraison et de l’environnement de démonstration.

Période d’exercice : du 5 Janvier 2026 au 22 Septembre 2026.

### 5. Informations complémentaires (facultatif)

/

# Titres, diplômes, CQP, attestations de formation

Rubrique facultative, à renseigner par le candidat.

| Intitulé                   | Autorité ou organisme | Date          |
| -------------------------- | --------------------- | ------------- |
| [à compléter si pertinent] | [à compléter]         | [à compléter] |

# Déclaration sur l’honneur

Je soussigné(e) Valentin Musset ,
déclare sur l’honneur que les renseignements fournis dans ce dossier sont exacts et que je suis l’auteur(e) des réalisations jointes.

Fait à le
pour faire valoir ce que de droit.

Signature :

# Documents illustrant la pratique professionnelle

Pièces proposées, à sélectionner et à légender avant remise :

- captures des parcours de réservation, d’invitation et de check-in ;
- extraits de code commentés et résultats de tests datés ;
- schémas UML et MERISE accompagnés du relevé de leurs écarts avec la V1 ;
- procédure de déploiement et preuve de CI correspondant à la version remise.

# Annexes

À compléter selon les consignes du centre et le référentiel de certification. Ne joindre que les pièces utiles aux exemples décrits.
