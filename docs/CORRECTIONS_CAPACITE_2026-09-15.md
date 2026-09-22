# Correction des règles de capacité — 15 septembre 2026

Cette livraison traite les points A1 et A2 de l'audit de finalisation. Elle ajoute aussi le bouton permettant de rejoindre une réservation publique après un refus. Les autres chantiers de l'audit restent ouverts.

## Défauts reproduits

Avant correction, les tests sur PostgreSQL réel obtenaient HTTP 200 au lieu de 409 pour :

- une réacceptation après refus, alors que la place avait été attribuée à un autre participant ;
- une réduction de capacité incompatible avec une réservation en cours ou future.

## Règles retenues

- Le propriétaire, les participants acceptés et les invitations en attente comptent dans la capacité.
- Un refus libère la place. Le passage direct de `DECLINED` à `ACCEPTED` est interdit et retourne HTTP 409.
- Une nouvelle invitation peut réactiver le participant ; une participation publique peut également le réinscrire. Ces deux actions recomptent les places disponibles.
- Un participant accepté peut toujours refuser et libérer sa place.
- La capacité d'un espace ne peut pas descendre sous le nombre de places réservées de chacune de ses réservations non terminées (`endAt > maintenant`). Le comptage se fait par réservation, pas en additionnant tous les créneaux.
- Les réservations terminées et les invitations refusées ne bloquent pas la réduction.
- Une réduction refusée laisse aussi inchangés les autres champs envoyés dans la même modification.

## Protection des demandes concurrentes

Les invitations et participations publiques verrouillent d'abord l'espace, puis la réservation, avant de lire la capacité et d'inscrire le participant. La modification d'espace verrouille le même espace avant de compter les participants et de modifier sa capacité. Les opérations se coordonnent donc même lorsqu'elles arrivent sur des connexions différentes.

Les réponses aux invitations verrouillent la réservation pour ne pas écraser une transition simultanée. Une réponse ne peut plus reprendre une place libérée ; elle n'a donc pas besoin d'augmenter la capacité réservée.

Le verrou sur l'espace sérialise les admissions de ses différents créneaux pendant ces transactions courtes. Ce choix privilégie la simplicité et l'intégrité pour le périmètre de Tempo. Aucune migration n'est nécessaire.

## Tests et résultats

La suite `apps/backend/src/integration/postgres-capacity.integration.spec.ts` contient 12 tests. Deux scénarios retiennent volontairement l'insertion d'un participant grâce à un verrou PostgreSQL, puis déclenchent une réduction : celle-ci doit attendre et rejeter la capacité devenue insuffisante. Les autres scénarios couvrent notamment les deux demandes pour la dernière place et la course entre réduction et admission.

| Vérification                        | Résultat local                              |
| ----------------------------------- | ------------------------------------------- |
| Backend unitaire et HTTP            | 99 tests réussis                            |
| Frontend                            | 18 tests réussis                            |
| Intégrations PostgreSQL existantes  | 3 tests réussis                             |
| Intégrations PostgreSQL de capacité | 12 tests réussis                            |
| TypeScript et Svelte                | Réussis, 0 erreur et 0 avertissement Svelte |
| Build frontend                      | Réussi                                      |
| Formatage et lint                   | Réussis                                     |

Les tests PostgreSQL ont été exécutés avec Bun 1.3.14 sur un PostgreSQL 18.4 temporaire, accessible uniquement sur l'interface locale, sans utiliser les données de l'application. La CI utilise toujours l'image PostgreSQL 18.6 configurée dans Compose et exécutera les deux suites via `bun run test:integration:postgres`. Aucune nouvelle exécution distante n'est revendiquée ici.

Les deux tests MongoDB et les deux E2E existants n'ont pas été rejoués dans cette intervention. Le total backend inventorié devient 116 tests (99 standards + 15 PostgreSQL + 2 MongoDB) ; seuls les 114 tests backend standards/PostgreSQL ont été exécutés ici. Les anciens chiffres du dossier devront être actualisés lors de sa prochaine révision.

Le formatage global demandé par le dépôt a également normalisé le Markdown du dossier professionnel et du compte rendu hebdomadaire. Leur contenu n'a pas été rédigé ou modifié sur le fond.

## Fichiers principaux

- `apps/backend/src/modules/bookings/booking-participants.service.ts` : transitions et verrous d'admission.
- `apps/backend/src/modules/workspaces/workspaces.service.ts` : réduction atomique avec contrôle des réservations.
- Les routes correspondantes : erreurs HTTP 409 compréhensibles.
- `apps/frontend/src/routes/bookings/+page.svelte` : participation publique de nouveau proposée après refus.
- `apps/backend/package.json` : nouvelle suite incluse dans la commande d'intégration utilisée par la CI.

La mise à jour des dépendances, les autres corrections du parcours QR, la révision des diagrammes et la rédaction des dossiers restent des étapes distinctes.
