# Audit de finalisation de Tempo — RNCP37873

Date : **15 septembre 2026**. Version Git examinée : `af1755af82659d9cf26dd032bc3bc70d33eae0d4`, avec les documents non commités présents dans le répertoire de travail.

## 1. Conclusion

**Tempo dispose d'un socle technique substantiel, mais l'ensemble application + dossier projet + dossier professionnel n'est pas prêt à être remis.** Le travail restant porte sur des défauts métier ciblés, les dépendances, la cohérence des preuves, la rédaction du DP et la préparation de la soutenance. Ajouter toute la V2 n'est pas nécessaire pour avancer vers la certification.

| Livrable                       | État constaté                                                                                       | Principal travail restant                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Application V1                 | Authentification, administration, réservation, collaboration, QR, audit et statistiques implémentés | Corriger les deux contournements de capacité ; consolider tests, sécurité et recette                             |
| Dossier projet                 | Onze sections structurées, contenu technique déjà conséquent                                        | Refaire les diagrammes de la V1, compléter preuves et veille, préciser gestion de projet et données personnelles |
| Dossier professionnel Markdown | Modèle presque entièrement vierge                                                                   | Rédiger les trois activités avec des exemples personnels, périodes, moyens et résultats                          |
| Livraison et démonstration     | Docker, migrations, seed et CI existants                                                            | Rétablir une CI verte sur la version finale, produire la recette et les exports vérifiés                         |

Ce bilan est un audit de préparation, pas une décision de validation du titre par le jury. Un pourcentage global d'achèvement serait trompeur : un DP vide ou une preuve essentielle absente ne se compense pas par un grand nombre de tests.

## 2. Référentiel applicable

Le titre visé est **Concepteur développeur d'applications, niveau 6, RNCP37873**. Les activités officielles sont : développer une application sécurisée ; concevoir et développer une application sécurisée organisée en couches ; préparer le déploiement d'une application sécurisée. La section 1 du dossier les reprend correctement, contrairement à `docs/RNCP_ANALYSIS.md`. [Fiche officielle](https://www.francecompetences.fr/recherche/rncp/37873/).

Le référentiel du titre complet prévoit un dossier de **40 à 60 pages**, hors garde, sommaire et annexes, avec au maximum 40 pages d'annexes. Il prévoit aussi un diaporama et accepte les projets de formation sans commanditaire réel. Ces prescriptions concernent le dossier de projet, pas une obligation de donner le même volume au DP. Aucune exigence d'URL publique n'a été identifiée. [Référentiel officiel, RE pages 5–7](https://certifpro.francecompetences.fr/api/fiches/refActivity/24449/472502).

La **POO est explicitement un critère d'évaluation** des composants métier. Le référentiel n'impose pas une syntaxe `class`, mais il faut démontrer les bonnes pratiques correspondantes. Les services objets littéraux ne permettent pas, à eux seuls, de conclure que cette preuve est acquise. Voir REAC page 23 et RE page 9 du même référentiel.

La note [Audit du référentiel](./AUDIT_RNCP_REFERENTIEL_2026-09-15.md) détaille les exigences et leurs sources. Le 7 octobre 2026 est une date imprimée dans le dossier ; la date réelle de l'examen et les modalités de remise du centre ne sont pas établies par les fichiers examinés.

## 3. Périmètre et vérifications réellement effectuées

### Documents et sources examinés

- Les deux Markdown de `3wa`, `PLAN_CORRECTIONS_DOSSIER.md`, `SPECS.md`, les trois README, `AGENTS.md`, `todo.md`, `docs/RNCP_ANALYSIS.md`.
- Les évaluations Markdown des semaines 1 et 2 et le compte rendu hebdomadaire Markdown.
- Les sources des diagrammes d'architecture, de classes, de cas d'utilisation, d'activité et de séquence ; inspection visuelle des MCD, MLD et MPD.
- Les modules métier backend, routes, DTO, schéma et migrations, la configuration sécurité, les principaux parcours frontend, les tests et la configuration Docker/CI.
- Les statuts GitHub Actions des dernières exécutions et le journal du dernier échec ; le référentiel officiel et des recommandations CNIL.

Les fichiers Word/ODT et PDF historiques ont été inventoriés mais leur contenu et leur mise en page n'ont pas été réaudités. Le fichier ODT professionnel a une modification locale préexistante : le constat « DP vide » concerne précisément le Markdown demandé. La maquette Figma distante et le tableau Trello vivant n'ont pas été inspectés ; leurs captures locales et descriptions ne prouvent pas un historique exhaustif. Aucun parcours visuel complet de l'application, audit d'intrusion, mesure de charge ou test de restauration n'a été exécuté pendant cet audit.

### Résultats du 15 septembre

| Contrôle                   | Résultat vérifié                                                 | Portée                                                                       |
| -------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Bun                        | 1.3.14                                                           | Runtime du poste                                                             |
| Tests backend standards    | **99 réussis**, 0 échec                                          | Tests unitaires et HTTP, intégrations exclues par le script                  |
| Tests frontend             | **18 réussis**, quatre fichiers                                  | Stores, client/API et gardes ; pas 18 tests d'écrans                         |
| Lint                       | Réussi                                                           | Dépôt local                                                                  |
| Types backend + Svelte     | Réussis ; Svelte : 0 erreur, 0 avertissement                     | Relance hors restriction de lecture Windows                                  |
| Build racine               | Réussi                                                           | Build frontend ; le backend n'a pas de script build, Bun exécute les sources |
| Format global              | **Échec**                                                        | DP Markdown et compte rendu hebdomadaire signalés avant ajout des rapports   |
| Audit des dépendances      | **43 alertes : 3 critiques, 12 élevées, 25 modérées, 3 faibles** | Résultat de `bun audit`, pas 43 exploitations démontrées                     |
| PostgreSQL / MongoDB / E2E | Non rejoués localement                                           | Docker absent du PATH ; pas de stack utilisable établie pendant l'audit      |
| Deux sondes de capacité    | Défauts confirmés au niveau service avec persistance simulée     | Pas une reproduction sur PostgreSQL réel                                     |

Les premiers essais frontend étaient empêchés par une restriction de lecture Windows. Après relance autorisée, tests, types et build réussissent : cette erreur initiale ne constitue pas un bug du projet.

### CI : preuve ancienne et état courant à distinguer

- [Exécution du 2 septembre, citée dans le dossier](https://github.com/Vaalley/tempo/actions/runs/33612722369) : **réussie**, commit `09bf966`.
- [Dernière exécution, du 3 septembre](https://github.com/Vaalley/tempo/actions/runs/33745279038) : **échec**, commit `af1755a`, identique au HEAD local. L'étape de formatage signale `output/pdf/compte-rendu-hebdomadaire-tempo.md`. Les étapes suivantes et le job Docker sont ignorés.

La capture verte n'est donc pas fictive, mais elle ne prouve pas une CI verte sur la version actuellement présentée. Après corrections, conserver le SHA, la date et le lien de la nouvelle exécution complète.

## 4. Application : corrections et règles à finir

### A1 — Priorité haute : une invitation refusée peut contourner la capacité

Source : `apps/backend/src/modules/bookings/booking-participants.service.ts`, méthode `respond`, ligne 93.

Scénario : salle de capacité 2 ; propriétaire + invité A ; A refuse ; B rejoint et prend la place ; A renvoie `ACCEPTED` sur son ancienne invitation. `respond` vérifie l'identité et la fin du créneau, puis change le statut sans vérifier l'ancien statut, sans recompter les places et sans verrouiller la réservation. On peut alors atteindre 3 participants pour 2 places. Cela peut également rétablir l'accès à une réservation privée après refus.

La sonde exécutée a appelé la vraie méthode avec un participant `DECLINED` et une base simulée ne proposant aucune opération de comptage ou transaction : elle a retourné `ACCEPTED`.

**À faire :** décider si une réponse est autorisée uniquement depuis `PENDING` ou si une réacceptation est permise ; dans ce second cas, contrôler capacité et transition sous le même verrou que les autres admissions. Traduire le refus en réponse métier exploitable. **Terminé quand :** scénario refus → place réattribuée → réacceptation couvert par un test PostgreSQL et jamais en surcapacité, y compris sous concurrence.

### A2 — Priorité haute : réduire la capacité invalide les réservations existantes

Source : `apps/backend/src/modules/workspaces/workspaces.service.ts`, `update`, ligne 26.

Un administrateur peut passer la capacité de 8 à 1 alors qu'une réservation compte plusieurs participants acceptés ou en attente. Le service applique directement les valeurs ; la contrainte SQL vérifie seulement `capacity >= 1`. La sonde exécutée confirme l'absence de lecture des réservations avant la mise à jour.

**À faire :** définir une règle de réduction pour les réservations en cours/futures ; rejeter une réduction incompatible ou organiser explicitement sa prise d'effet. Synchroniser cette modification avec les admissions concurrentes. **Terminé quand :** réduction incompatible refusée, augmentation acceptée, et test de concurrence avec une invitation.

### A3 — Priorité haute : traiter les dépendances signalées

`bun audit` retourne 43 alertes. Les manifests annoncent notamment Vitest 4.1.8 et Vite 7.3.5, mais `bun.lock` contient aussi d'anciennes variantes transitives, dont `@vitest/browser` 4.0.16 et Vite 7.3.0. Lire uniquement les versions directes du dossier masque donc une partie du problème.

Trier chaque alerte par version résolue, chemin de dépendance, usage réel, environnement et correctif. Retirer les outils inutilisés, mettre à jour de manière contrôlée, puis rejouer types, tests, build et Docker. Vérifier aussi les images de conteneurs séparément : `bun audit` ne les couvre pas.

Exemple : SvelteKit 2.63.1 est antérieur au correctif 2.70.2 indiqué pour le déni de service sur l'en-tête `Accept`. C'est un sujet serveur à examiner, pas uniquement un problème d'outil de développement. [Avis SvelteKit](https://github.com/advisories/GHSA-29g2-3rmr-qm68). À l'inverse, certaines alertes Hono portent sur Lambda ou JSX, que les modules inspectés n'utilisent pas. Éviter d'assimiler le total brut à des failles exploitables démontrées.

**Terminé quand :** alertes corrigées ou décisions d'applicabilité justifiées, rapport daté conservé, non-régression vérifiée. Ce travail fournit une excellente matière factuelle pour la section 11.

### A4 — Priorité moyenne : erreurs métier et parcours QR

Sources : `apps/frontend/src/lib/authorized-api.ts`, `api-response.ts`, `routes/check-in/+page.svelte`.

- Tous les HTTP 403 déclenchent un retour à l'accueil. Un QR invalide retourne justement 403 : le parcours peut quitter la page au lieu de laisser lire « Check-in refusé ». Distinguer une erreur métier de l'accès interdit à une page d'administration.
- Avec une session locale existante mais un JWT expiré, le jeton QR est retiré de l'URL avant l'appel API ; le gestionnaire 401 redirige sans conserver cette destination. Ajouter un test QR → session expirée → connexion → reprise du check-in.
- Une nouvelle validation de présence écrase `checkedInAt` avec l'heure courante. Décider si le check-in doit conserver la première heure et être idempotent, puis le tester.
- Le bouton « Rejoindre » exige l'absence de participant ; après refus, la ligne `DECLINED` existe encore et le bouton n'apparaît pas, alors que `joinPublic` prévoit ce retour. Harmoniser cette transition.

Ces constats résultent de la lecture des chemins de code ; les parcours navigateur correspondants restent à reproduire.

### A5 — Priorité moyenne : préciser temps, suppression et indicateurs

- La validation impose début < fin, mais accepte des réservations passées. Le test collaboratif crée volontairement un début deux minutes dans le passé. Définir la règle, sans ajouter une interdiction incompatible avec la réservation immédiate.
- Documenter le fuseau, la conversion navigateur/UTC et la borne `startAt <= now < endAt`. Tester les changements de jour et d'heure si la démonstration les traverse.
- La suppression d'un espace efface par cascade ses réservations, y compris historiques, et leurs participants/QR. L'audit actuel capture l'espace, pas la liste complète des réservations détruites. Décrire ce comportement et décider s'il convient au MVP.
- Les statistiques mesurent des **espaces réservés à l'instant courant**, pas une présence physique constatée : `analytics.service.ts` ne lit pas `checkedInAt`. Renommer précisément l'indicateur ou développer séparément un indicateur de présence.
- Un QR partagé permet une déclaration à distance. Retirer toute promesse de preuve de présence physique ; une présence déclarée par un compte authentifié est la preuve réellement fournie.
- La création administrative d'un email déjà existant n'a pas de traduction explicite en 409. Ajouter une erreur claire ; considérer aussi la concurrence entre deux inscriptions du même email.

### A6 — Recette fonctionnelle et non fonctionnelle

Ajouter des tests du **vrai service** de participants et de check-in : capacité atteinte, admissions concurrentes, tiers non autorisé, refus/réacceptation, jeton faux, expiré et renouvelé, fin exacte du créneau, répétition du check-in. Les cinq tests de `booking-collaboration.routes.spec.ts` remplacent les services par des mocks : ils vérifient les routes, pas l'intégralité de ces invariants.

Compléter une recette manuelle datée : inscription, USER/ADMIN, CRUD espaces, annulation, audit, visibilité privée, invitations, QR, erreurs réseau et session expirée. Le deuxième E2E prépare réservation/invitation/QR par API ; il ne prouve pas toute la manipulation du panneau de gestion ni le scan physique d'un téléphone.

Pour le QR sur téléphone, `localhost` désigne le téléphone lui-même. Prévoir une origine accessible depuis le matériel de démonstration et tester le scan réel. Aucune publication Internet n'est nécessaire pour cette recette locale.

Vérifier clavier, focus, labels, annonces d'erreur, contraste, zoom et largeur mobile sur les parcours principaux. Les contrôles Svelte sans avertissement ne sont pas un audit d'accessibilité. Ajouter une matrice navigateur réellement testée. Mesurer l'objectif déjà annoncé de 300 ms avec un nombre de données/utilisateurs, un environnement et un percentile définis ; éviter d'affirmer une capacité de charge avant mesure.

### A7 — Démonstration interne et exploitation réelle

Pour une démonstration : stabiliser les points ci-dessus, utiliser des comptes fictifs, disposer d'une procédure reproductible et documenter les limites.

Avant un usage réel : traiter l'inscription publique dans une application dite interne, les sessions/révocations, le stockage du JWT, HTTPS et la protection du frontend. Les en-têtes Hono configurés dans `app.ts` concernent l'API ; ils ne prouvent pas une CSP sur les pages servies séparément par SvelteKit. La migration vers des cookies sécurisés doit être conçue avec la protection CSRF adaptée.

Le Compose publie aussi PostgreSQL et MongoDB sur l'hôte et ne constitue pas une configuration de serveur public prête à l'emploi. Prévoir des comptes de base aux permissions limitées, des bases non exposées, des sauvegardes vérifiées et un suivi des incidents. `/health` répond `OK` sans contrôler la disponibilité courante des bases : c'est une preuve de réponse du processus.

Les lectures de réservations et les statistiques chargent les données sans pagination ou agrégation SQL adaptée à une forte volumétrie. À mesurer puis améliorer selon les objectifs retenus ; ce n'est pas une raison de réécrire le projet en architecture distribuée.

## 5. Dossier projet : reste à faire section par section

| Section               | Acquis                                                                 | Travail restant et preuve attendue                                                                                                                        |
| --------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Compétences        | Les onze compétences sont décrites à la première personne              | Matrice compétence → réalisation → fichier → test/capture → difficulté résolue ; preuve POO explicite                                                     |
| 2. Cahier des charges | Besoin, rôles, périmètre, cible et objectif 300 ms                     | Priorité/statut/acceptation pour les besoins ; règles temporelles ; protocole performance ; exigences accessibilité ; traitement des données personnelles |
| 3. Contexte           | Projet personnel hors alternance clairement expliqué                   | Dates, contraintes, objectifs observables, avant/après ; deux personas utiles, sans inventer un client                                                    |
| 4. Gestion de projet  | Kanban, captures Git/Trello, rôles personnels                          | Planning daté, jalons, prévisionnel/réalisé, écarts, risques et arbitrages ; critères de fin d'une tâche                                                  |
| 5. Spécifications     | Cartographie et huit fonctionnalités détaillées, migrations expliquées | Modèles de données et diagrammes V1 concordants ; séparer schéma initial et schéma livré ; corriger les garanties de capacité                             |
| 6. Technique          | Versions, routes, ports, CI et limites explicites                      | Versions après mises à jour, périmètre réel des en-têtes, nature des statistiques, procédure de démonstration et recette navigateur                       |
| 7. Réalisations       | Six exemples avec extraits et argumentation                            | Remplacer les six demandes de captures ; privilégier les preuves visibles reliées à une action et au code final                                           |
| 8. Sécurité           | Hash, JWT, droits, validation, contraintes, QR et limites              | Traitement des alertes de dépendances ; corriger les deux exceptions à la capacité ; distinguer protection API et frontend                                |
| 9. Tests              | Comptages et niveaux correctement distingués                           | Nouvelle exécution datée ; portée réelle des mocks ; nouveaux cas de refus/concurrence ; résultats de recette                                             |
| 10. Jeu d'essai       | Scénarios JE1–JE13 présents                                            | Données précises, attendu/obtenu par cas, erreurs et corrections, capture présence ; CI du même commit                                                    |
| 11. Veille            | Consigne de rédaction seulement                                        | Rédiger une pratique réelle avec sources, dates, analyse, action et vérification ; exploiter le présent audit des dépendances                             |

### Diagrammes : correction indispensable

Le texte prévient que les modèles de données sont une cible. Cette précision est utile mais ne remplace pas un modèle de la base effectivement livrée. Le schéma réel a cinq tables ; le MCD/MLD/MPD et le diagramme de classes présentent encore entreprises, tables de rôles/types, autres identifiants et QR différents.

| Sujet        | Diagrammes actuels                                                         | Implémentation constatée                                                                |
| ------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Routes       | `/api/bookings/my`, `/api/bookings/checkin`, `/api/invitations/:id/accept` | `/bookings`, `/bookings/:id/check-in`, `PATCH /bookings/:id/invitations/:participantId` |
| Création     | `isPublic`, invités dans le POST initial, table `booking_invitations`      | `visibility`, invitation séparée, `booking_participants`                                |
| Annulation   | Délai 24 h, statut CANCELLED et notifications                              | Suppression physique, aucune règle 24 h, audit best effort                              |
| Check-in     | QR de salle, statut sur réservation, audit CHECK_IN                        | Jeton de réservation hashé, présence individuelle, pas d'audit CHECK_IN                 |
| Temps        | Fin inclusive dans certains diagrammes                                     | Fin exclue dans le service                                                              |
| Espaces      | Quota, notifications ; absence de séquence de modification                 | `name/type/capacity`, PATCH implémenté, suppression en cascade                          |
| Architecture | Séquences API → DB                                                         | Routes et services distincts à montrer ; architecture générale as-built déjà présente   |

**Action :** produire un jeu cohérent V1 (modèle relationnel, classes/responsabilités, cas d'utilisation et séquences représentatives) et régénérer les images. Conserver les cibles seulement comme documents historiques ou perspectives clairement légendées. Ne pas développer des notifications simplement pour rendre vrais d'anciens diagrammes.

### Données personnelles : contenu minimum à ajouter

Décrire finalités, données nécessaires, personnes habilitées, durée de conservation et purge, interlocuteur pour les droits et distinction comptes/réservations/présence/audit. Le hash et MongoDB ne suffisent pas à établir une conformité RGPD. La rétention doit être motivée par la finalité. [CNIL — durées de conservation](https://www.cnil.fr/fr/passer-laction/les-durees-de-conservation-des-donnees).

Prévoir une information intelligible et un moyen d'exercer les droits avant de traiter des données réelles. Une procédure manuelle documentée peut servir au périmètre initial ; le référentiel ne demande pas nécessairement un portail automatisé d'export/suppression. [CNIL — information](https://www.cnil.fr/fr/conformite-rgpd-information-des-personnes-et-transparence).

Réduire les données recopiées dans `entityData`, définir la conservation de l'audit et expliquer que supprimer une réservation SQL ne supprime pas sa copie d'audit. [CNIL — journalisation](https://www.cnil.fr/fr/securite-tracer-les-operations).

### Nettoyage éditorial et exports

- Sept emplacements « Insérer… » subsistent : six en section 7, un en section 10 ; la section 11 reste une consigne.
- Sur vingt références d'images, une cible est absente : `Dossier_projet_Valentin_Musset_htm_8a4710a1.png`, dans le pied de page final parasite. Le plan parle d'une couverture manquante : le lien brisé effectivement trouvé est en fin de document.
- Supprimer le pied de page importé et le caractère de contrôle après « DOSSIER PROJET » ; transformer le sommaire en navigation utilisable et vérifier la pagination finale.
- Vérifier la date de garde, les légendes et les références des extraits. Ne pas inventer de temps passé : une estimation rétrospective peut être donnée en étant identifiée comme telle.
- Exporter le dossier final, compter ses pages et inspecter chaque page, les tableaux, les diagrammes, les coupures de code et les images. Aucun PDF final du dossier projet n'est établi par cet audit.

## 6. Dossier professionnel : travail de rédaction distinct

Le Markdown professionnel contient encore « Entrez votre nom », « Cliquez ici », des activités sans intitulé, des réponses vides et une déclaration non complétée. Il ne constitue pas encore un récit de pratique.

### Structure proposée

| Activité officielle                                                    | Exemple principal proposé                                | Ce qu'il faut raconter                                                                            |
| ---------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Développer une application sécurisée                                   | Réaliser le parcours de réservation et ses autorisations | Tâches personnelles, interface, validation, problème de concurrence, solution, tests et résultat  |
| Concevoir et développer une application sécurisée organisée en couches | Concevoir les données et organiser l'accès SQL/NoSQL     | Besoin initial, maquette, arbitrage du modèle, séparation des responsabilités, migration et audit |
| Préparer le déploiement d'une application sécurisée                    | Préparer et vérifier une livraison Docker avec CI        | Environnement, plan d'essai, incident de CI, correction, rapport, déploiement et limites          |

Pour chaque exemple, remplir les cinq rubriques du modèle : opérations et conditions ; moyens ; interlocuteurs ; contexte et période ; compléments éventuels. Donner un résultat observé et une preuve pertinente. La correction réelle de l'échec CI peut devenir un exemple utile après sa réalisation.

Un exemple consistant par activité est un point de départ ; ajouter jusqu'à trois exemples selon les pratiques réellement disponibles et les consignes du centre. Si une autre réalisation d'alternance apporte une meilleure preuve de travail collectif ou de POO, elle peut compléter Tempo sans inventer un rôle ou une intervention.

### Actions administratives et éditoriales

- Renseigner identité, intitulé exact et modalité d'accès réelle.
- Retirer la quatrième activité du sommaire : le titre en comporte trois.
- Renseigner les périodes et le contexte de formation/projet personnel.
- Compléter et signer personnellement la déclaration sur l'honneur.
- Ajouter les titres/attestations et pièces facultatives uniquement s'ils sont utiles.
- Conserver les rubriques officielles du modèle ; supprimer les champs de remplacement après remplissage, sans effacer arbitrairement les notices institutionnelles.
- Réconcilier le Markdown et les versions Word/ODT pour choisir une source de référence, puis exporter et relire.

## 7. Correspondance des onze compétences et des preuves

| Compétence            | Base disponible                          | Preuve à compléter                                               |
| --------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| Installer/configurer  | Workspaces, exemples env, Docker, README | Recette sur environnement neuf et explication des versions       |
| Interfaces            | Pages Svelte, RPC, gestion de session    | Captures, accessibilité, mobile, erreurs réelles                 |
| Composants métier     | Réservations, participants, QR           | Corrections capacité, tests des services, démonstration POO      |
| Gestion de projet     | Git, Trello, plan                        | Dates, changements, écarts, critères de recette                  |
| Besoins/maquettes     | SPECS, capture Figma                     | Périmètre à jour, acceptation, passage maquette → réalisation    |
| Architecture          | Modules, schéma d'architecture           | Séquences fidèles, choix et limites motivés                      |
| Base relationnelle    | Schéma Drizzle et cinq migrations        | Modèle livré, contraintes expliquées, restauration vérifiée      |
| SQL/NoSQL             | Drizzle et audit Mongo                   | Extraits réels, intégrations, choix et rétention des audits      |
| Plans de tests        | Unitaires, HTTP, intégrations, E2E       | Couverture des risques et compte rendu final daté                |
| Déploiement documenté | Compose, seed, README                    | Procédure essayée, sauvegarde/restauration et retour arrière     |
| DevOps                | Workflow et historique CI                | Nouvelle CI verte, lecture d'un échec, traçabilité d'une version |

Concernant la POO, `ApiError extends Error` existe dans le frontend et `MemoryStorage` dans les tests. Ne pas présenter ces deux classes comme une démonstration suffisante de conception des composants métier. Préparer un exemple explicite d'encapsulation et de collaboration entre objets ; si la réalisation ne permet pas de le démontrer, prévoir un développement ciblé ou une autre réalisation personnelle pertinente.

## 8. Révision du plan de corrections existant

Le plan reste utile, mais il faut distinguer réalisation passée et état final vérifié.

| Entrée du plan                                                       | Conclusion d'audit                                                                               |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Gardes ADMIN, hash non retourné, JWT obligatoire, origine configurée | Présents dans les chemins inspectés et soutenus par les tests                                    |
| Exclusion PostgreSQL et bornes analytics                             | Implémentées ; les statistiques restent des réservations, pas une mesure de présence             |
| CRUD espaces, audit consultable, invitations et QR                   | Implémentés ; les défauts de capacité imposent une reprise ciblée                                |
| 99 + 5 backend, 18 frontend, 2 E2E                                   | Inventaire cohérent ; 99 + 18 rejoués ici, intégrations/E2E à distinguer des preuves historiques |
| « CI passe » et qualité entièrement terminée                         | À rouvrir : dernier run échoue au format                                                         |
| « diagrammes correspondent » / section 5 finalisée                   | À rouvrir : contrats, données et comportements divergents                                        |
| « chaque fonctionnalité est démontrable »                            | À revalider après corrections et recette de la version finale                                    |
| Accessibilité et navigateurs                                         | Limites décrites honnêtement, recette à produire pour étayer l'usage annoncé                     |
| Couverture manquante                                                 | Reformuler : une image brisée est identifiée dans le pied de page                                |
| POO, preuves, planning, RGPD, veille, PDF                            | Chantiers toujours ouverts                                                                       |
| DP et vulnérabilités des dépendances                                 | Ajouter explicitement : insuffisamment couverts par le plan actuel                               |

Mettre à jour `SPECS.md`, qui décrit toujours la cible comme des spécifications courantes. Archiver clairement les évaluations anciennes et `todo.md` : semaine 1 exige notamment une annulation à 24 h, et semaine 2 affirme une fusion bloquée par CI. Ces documents historiques ne doivent plus servir de description de la V1. Retirer aussi l'affirmation non démontrée « aucun correctif bloquant nécessaire » du compte rendu s'il est réutilisé comme bilan actuel.

## 9. Ordre de finalisation recommandé

Les priorités ci-dessous désignent le risque pour la remise et la démonstration, pas une sévérité CVSS.

1. **Figer le contrat de la V1** : visibilité, transitions des invitations, capacité, annulation physique, temps, statistiques de réservation, limites du QR. Une page de décisions suffit pour lancer le travail.
2. **Corriger A1/A2 et trier les dépendances** ; ajouter les tests qui exercent réellement les règles concernées.
3. **Stabiliser les erreurs et le parcours QR**, puis mener la recette fonctionnelle et la démonstration téléphone si elle est annoncée.
4. **Refaire les diagrammes de la V1**, aligner SPECS, dossier et tableau de preuves ; consolider la démonstration POO.
5. **Rédiger le DP dès maintenant en parallèle du travail documentaire** : les dates et l'expérience personnelle demandent du travail propre au candidat.
6. **Compléter projet sections 2–4 et 7–11** : planning, arbitrages, données personnelles, captures, résultats et veille réellement pratiquée.
7. **Relancer tous les contrôles et obtenir une CI verte sur la version finale** ; conserver les résultats d'intégration, E2E et recette Docker. Essayer la sauvegarde/restauration sur des bases de démonstration dédiées.
8. **Exporter et vérifier les deux dossiers**, préparer le diaporama, répéter l'oral et préparer le questionnaire anglais. Confirmer les modalités de remise auprès du centre.

### Ce qui peut rester en V2

Entreprises/multi-tenant, sites, notifications, quotas avancés, annulation logique, SSO et intégrations calendaires peuvent rester hors périmètre si cela est cohérent partout. Le filtrage et la disponibilité par créneau amélioreraient le produit, mais leur absence ne justifie pas de repousser la rédaction du DP. Un hébergement public peut enrichir la démonstration ; il ne remplace pas les preuves manquantes.

### Critères de fin

- [ ] Aucun dépassement de capacité dans les scénarios identifiés et leurs variantes concurrentes.
- [ ] Alertes de dépendances corrigées ou évaluées avec justification et contrôle de non-régression.
- [ ] Version de démonstration identifiable, installable et testée ; CI correspondante réussie.
- [ ] Fonctionnalités, modèles, routes, captures et chiffres identiques dans toutes les pièces finales.
- [ ] Chaque compétence dispose d'une preuve et d'une explication personnelle, y compris la POO.
- [ ] DP renseigné pour les trois activités et déclaration complétée personnellement.
- [ ] Dossier projet sans emplacements vides, veille rédigée et résultats d'essais traçables.
- [ ] PDFs relus visuellement, pagination conforme et diaporama prêt.

**Décision recommandée : consacrer la prochaine phase à terminer et prouver la V1 existante. Le projet possède déjà assez de matière pour construire les deux dossiers ; sa finalisation exige surtout que les affirmations résistent à une démonstration et aux questions du jury.**
