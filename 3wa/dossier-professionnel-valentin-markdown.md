# Dossier professionnel

Nom de naissance : Musset

Nom d’usage : Musset

Prénom : Valentin

Adresse : 23 rue Louis Joxe, 44200, Nantes

Titre professionnel visé : Concepteur développeur d’applications (RNCP 37873)

Modalité d’accès : Parcours de formation

☐ Parcours de formation
☐ Validation des Acquis de l’Expérience (VAE)

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
3. Préparer le déploiement d’une application sécurisée : tester, livrer et publier Tempo en HTTPS.
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

### Exemple n° 1 : Préparer les tests et publier Tempo dans un environnement Docker

### 1. Décrivez les tâches ou opérations que vous avez effectuées, et dans quelles conditions

J’ai préparé deux Dockerfiles multi-stage et une configuration Docker Compose pour le frontend, le backend, PostgreSQL et MongoDB. Le backend applique les migrations avant de démarrer. Un seed crée les comptes et espaces de démonstration. Les variables sont décrites dans des fichiers d’exemple ; les secrets réels ne sont pas versionnés.

J’ai organisé les tests par niveau : services et routes, frontend, intégrations PostgreSQL et MongoDB, puis parcours navigateur. Le workflow GitHub Actions prévoit le formatage, le lint, les types et le build, suivis d’une recette Docker. Les traces des échecs Playwright sont conservées comme artefacts.

Les vérifications locales du 17 septembre ont validé les tests backend, frontend, PostgreSQL et les parcours Chromium, ainsi que les types, le lint, le formatage et le build. Lors de la préparation du déploiement du 22 septembre, 106 tests backend et 22 tests frontend ont de nouveau réussi, avec le formatage et le lint. Les suites d’intégration et les parcours navigateur n’ont pas été rejoués à cette occasion.

Le 22 septembre 2026, j’ai choisi d’héberger la démonstration sur une machine Ubuntu mise à disposition par un ami. J’ai fait en sorte que les fichiers et les données de Tempo soient regroupés dans `/opt/tempo/` pour faciliter leur retrait. J’ai autorisé séparément le transfert, le démarrage et la publication, car la machine héberge déjà d’autres services.

Les images du frontend et du backend ont été construites sur le serveur. Docker Compose organise cinq services : PostgreSQL, MongoDB, l’API, le frontend et une passerelle Caddy. Les données persistent dans `/opt/tempo/data/`. Les secrets nécessaires ont été transférés séparément dans `.env.host`, lisible uniquement par root ; ils ne sont pas intégrés aux images. Seule la passerelle publie un port sur l’interface locale du serveur. Les bases ne sont pas directement exposées à Internet.

Le premier démarrage a révélé une incompatibilité entre MongoDB 8.0.29 et le noyau Linux 7.0 de la machine. Après lecture des journaux et vérification de la cause, j’ai validé l’utilisation de MongoDB 7.0.43 dans le conteneur Tempo, sur une base encore vide. Cette adaptation a permis le démarrage sans modifier le système d’exploitation de mon ami.

J’ai créé le sous-domaine gratuit `tempo-val.duckdns.org` et renseigné l’adresse IPv4 du serveur dans DuckDNS. Le proxy Caddy déjà présent sur la machine a ensuite été configuré pour transmettre les requêtes vers Tempo et gérer HTTPS. Le site et l’API partagent la même origine, l’API étant accessible sous `/api`. Un fichier de raccordement reste dans `/srv/tempo/caddy.conf` ; il constitue une exception au regroupement dans `/opt/tempo/`.

Le site est accessible à l’adresse https://tempo-val.duckdns.org. Les vérifications ont confirmé une réponse HTTP 200 du site, le fonctionnement de l’API, une redirection HTTP vers HTTPS et un cookie de session `HttpOnly`, `Secure` et `SameSite=Strict`. Une route protégée refuse les accès non authentifiés avec HTTP 401. Le seed a créé deux comptes, quatre espaces et une réservation publique avec une invitation en attente. La connexion et la restauration de session des deux rôles ont été vérifiées via HTTPS.

### 2. Précisez les moyens utilisés

Docker Compose, Dockerfiles multi-stage, SSH, serveur Ubuntu, Caddy, DuckDNS, Git, GitHub Actions, commandes Bun, Bun Test, Vitest, Playwright et bases dédiées aux intégrations. Les fichiers `compose.host.yml`, `deployment/compose.mongo7.yml`, `deployment/Caddyfile` et `deployment/public.caddy.conf` décrivent le déploiement public.

### 3. Avec qui avez-vous travaillé ?

Projet personnel réalisé avec l’aide des formateurs de la 3WA et de mon tuteur en entreprise. Un ami a mis à disposition la machine d’hébergement.

### 4. Contexte

Nom de l’entreprise, organisme ou association : Collectif Energie ; projet personnel Tempo ; Ecole 3WAcademy.

Chantier, atelier, service : préparation de la livraison et publication de l’environnement de démonstration sur un serveur partagé. Un ami a mis la machine à disposition.

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
- procédure de déploiement, compte rendu du 22 septembre (`docs/DEPLOIEMENT_2026-09-22.md`) et preuve de CI correspondant à la version remise ;
- configuration Docker et raccordement HTTPS, sans identifiants ni mots de passe.

# Annexes

À compléter selon les consignes du centre et le référentiel de certification. Ne joindre que les pièces utiles aux exemples décrits.
