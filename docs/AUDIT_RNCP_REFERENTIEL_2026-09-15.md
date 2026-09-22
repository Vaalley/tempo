# Audit du référentiel CDA applicable à Tempo

Date : 15 septembre 2026. Périmètre : identification du titre, exigences documentaires, correspondance avec les documents locaux. Cette note ne valide pas l'exécution de l'application ; les preuves techniques font l'objet de l'audit principal.

## 1. Titre et version vérifiés

Le titre visé dans la page de garde est le **TP Concepteur développeur d'applications, RNCP37873, niveau 6**. Sa période d'enregistrement court du 18 décembre 2023 au 18 décembre 2028. Le 7 octobre 2026 figure comme date du dossier ; cela ne confirme pas une date de session d'examen. Cette date de document est comprise dans la période d'enregistrement. [France compétences](https://www.francecompetences.fr/recherche/rncp/37873/).

Les trois activités officielles sont :

1. Développer une application sécurisée.
2. Concevoir et développer une application sécurisée organisée en couches.
3. Préparer le déploiement d'une application sécurisée.

Ces intitulés sont définis par l'[arrêté du 26 avril 2023, article 3](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000047541129).

La fiche prévoit une présentation de 40 minutes, un entretien technique de 45 minutes, un questionnaire de 30 minutes et un entretien final de 20 minutes incluant le dossier professionnel. Le questionnaire utilise une documentation anglaise, deux questions fermées en français et deux réponses courtes en anglais. Le jury peut approfondir les compétences absentes du projet. [Modalités de la session titre](https://www.francecompetences.fr/recherche/rncp/37873/).

## 2. Exigences précises du document officiel

Le fichier officiel combine le REAC (50 pages) et le référentiel d'évaluation (RE, 42 pages), code TP-01281, millésime 04, mise à jour du 24 mai 2023.

- Session du titre complet : corps du dossier de 40 à 60 pages, illustrations comprises ; garde, sommaire et annexes exclus ; annexes limitées à 40 pages (RE p. 5–6).
- Dossier imprimé et diaporama nécessaires.
- Un projet de formation peut être sans commanditaire réel. Son plan comprend compétences, besoins et limites, environnement technique, réalisations (RE p. 5–7).
- Huit compétences doivent être pratiquées dans les projets : interfaces, métier, gestion de projet, besoins/maquettes, architecture, base relationnelle, accès SQL/NoSQL et plans de tests (RE p. 5).
- La préparation du déploiement et la contribution DevOps sont évaluées à l'entretien ; la grille vise procédures, scripts, tests automatisés, intégration continue et lecture de rapports. Elle ne prescrit pas d'URL publique (RE p. 11).
- Le plan entreprise détaille modèles de données, cas d'utilisation, séquences, code, sécurité, essais avec résultats et veille (RE p. 6).

Source de l'ensemble de cette section : [référentiel officiel diffusé par France compétences](https://certifpro.francecompetences.fr/api/fiches/refActivity/24449/472502).

## 3. Contradictions locales et corrections recommandées

### Programmation orientée objet : preuve à consolider

Le référentiel impose explicitement : « Les bonnes pratiques de la programmation orientée objet (POO) sont respectées ». Ce critère figure au REAC p. 23 et au RE p. 9 (pages 23 et 59 du PDF combiné). Le REAC p. 23–24 vise également un langage orienté objet et les connaissances associées. Aucune obligation spécifique de syntaxe `class` n'a été trouvée. [Référentiel officiel](https://certifpro.francecompetences.fr/api/fiches/refActivity/24449/472502).

**Conséquence pour Tempo, appréciation de l'audit :** `bookingService`, notamment, est un objet littéral regroupant des méthodes dans `apps/backend/src/modules/bookings/bookings.service.ts`. Cela n'établit pas à lui seul une démonstration suffisante de conception objet. Inversement, l'absence de `class` n'autorise pas à conclure automatiquement à une non-conformité. Le dossier doit présenter un exemple concret et explicable de responsabilités, d'encapsulation et de composition. Si aucun exemple actuel ne permet cette démonstration, prévoir un composant métier réellement conçu selon ces principes, accompagné de tests et d'une justification. Renommer un objet ou ajouter une classe vide ne résoudrait pas cette lacune de preuve. Le choix d'un composant et sa nécessité doivent être tranchés après l'audit technique, sans refonte générale présupposée.

### Ancienne analyse RNCP à remplacer

`docs/RNCP_ANALYSIS.md` organise le titre autour de blocs « front-end », « back-end » et « concevoir et déployer ». Ces titres ne correspondent pas aux activités officielles ci-dessus. La section 1 du dossier projet emploie déjà la bonne organisation : la conserver et corriger l'ancienne analyse.

L'ancienne analyse affirme aussi que le projet est « déjà techniquement au niveau attendu », mentionne « 28+ tests », une « architecture hexagonale » et conclut qu'il manque essentiellement documentation et déploiement. Ce sont des appréciations non étayées dans ce document. Elles ne remplacent ni un contrôle de l'état actuel du code ni des preuves de résultats. Retirer cette conclusion automatique et dater la prochaine matrice de preuves.

### Contexte personnel correctement déclaré

Le dossier projet indique aux sections 2 et 3 que Tempo est personnel, réalisé hors de la structure d'alternance, sans entreprise commanditaire. Conserver cette transparence. Le plan détaillé actuel peut rester utile : l'existence d'un plan entreprise dans le modèle n'oblige pas à inventer un client, une équipe ou une validation externe.

### Dossier professionnel encore au stade du modèle

Le Markdown contient encore les champs d'identité et de titre vides, les intitulés d'activités et d'exemples non renseignés, les périodes et les contextes vierges, ainsi qu'une déclaration à compléter. Son sommaire prévoit une activité n° 4, alors que le titre en comporte trois. Les consignes locales demandent un à trois exemples par activité : trois exemples bien documentés, un par activité, constituent un point de départ concret ; ajouter des exemples seulement lorsqu'ils apportent une pratique différente.

Le dossier projet et le dossier professionnel remplissent des fonctions distinctes. Pour le second, décrire une situation vécue, ses tâches personnelles, ses moyens, ses interlocuteurs réels, sa période et ses résultats. Éviter de recopier tout le cahier des charges.

## 4. Proposition de correspondance avec Tempo

La matrice suivante est une recommandation d'organisation issue des sections 1.1 à 1.3 du dossier projet ; elle n'est pas une validation des réalisations annoncées.

| Activité | Exemple proposé pour le dossier professionnel                           | Pièces à réunir et vérifier                                                                                                                                                                                     |
| -------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | Réalisation du parcours de réservation sécurisé                         | Écran réel, validations, service métier, contrôle des rôles, conflit de créneau, test exécuté, ticket ou commit ; préciser sa contribution personnelle et les difficultés résolues.                             |
| 2        | Conception et persistance des réservations et participants              | Besoin, maquette, diagramme cohérent, migration SQL, contrainte d'intégrité, accès MongoDB, justification des choix ; raconter une décision de conception et ses conséquences.                                  |
| 3        | Préparation d'une version reproductible et vérification avant livraison | Plan de recette daté, commande et résultat de test, rapport CI du même commit, procédure Docker, migration, sauvegarde/restauration et procédure de retour arrière ; distinguer exécuté et seulement documenté. |

Pour chaque compétence de la section 1 du dossier projet, ajouter une référence courte vers une réalisation et un résultat vérifiable. Un nom de technologie ou un nombre de tests ne suffit pas à expliquer la compétence acquise.

## 5. Reste à faire conseillé, côté certification

1. Compléter le dossier professionnel à partir de faits réels et conserver seulement les trois activités applicables.
2. Réconcilier les preuves du dossier projet avec le code et les diagrammes actuels ; dater les résultats et identifier la version testée.
3. Produire une version imprimable, puis compter les pages du rendu final et vérifier les illustrations. Le nombre de lignes Markdown ne permet pas de conclure à la conformité de pagination.
4. Préparer le diaporama et répéter la présentation en temps limité, avec un scénario de démonstration reproductible.
5. Préparer l'explication des choix techniques, des limites, d'un problème résolu et des résultats d'essais ; s'entraîner à lire une documentation en anglais et répondre brièvement.
6. Confirmer auprès du centre les modalités pratiques de remise et la date réelle ; ces consignes de session ne sont pas dans les sources inspectées.

L'hébergement public peut être une preuve utile si un déploiement effectif est revendiqué. Il ne faut pas en faire artificiellement la condition unique de validation du titre. De même, aucune source consultée ne fixe Bun, Svelte, Kubernetes, un paiement SaaS ou un pourcentage universel de couverture de tests comme condition de réussite : ajouter de telles fonctionnalités n'est pas la priorité de cet audit.

## Limites

Cette recherche a vérifié le référentiel publié et les documents Markdown locaux cités. Elle ne certifie ni l'inscription administrative du candidat, ni la maîtrise à l'oral, ni la conformité du rendu Word/PDF, ni le fonctionnement de l'application. Les évaluations de semaine 1 et 2 sont des traces pédagogiques historiques : leurs descriptions ne prouvent pas à elles seules l'état de la version actuelle.
