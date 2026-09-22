# Migration des sessions vers un cookie HttpOnly — 17 septembre 2026

## Résultat

- JWT HS256 de 24 heures dans `tempo_session`, `HttpOnly`, `SameSite=Strict`, `Path=/`, sans `Domain`.
- `Secure` lorsque `FRONTEND_ORIGIN` est en HTTPS ; HTTP local conservé pour le développement.
- Réponse de connexion limitée au compte. Aucune persistance du compte ou du JWT dans le stockage web ; suppression des anciennes clés `token` et `user`.
- Restauration du compte avec `GET /auth/session`, état frontend en mémoire et écran de reprise en cas de panne réseau.
- Déconnexion avec `POST /auth/logout`. Le frontend ne confirme la déconnexion qu’après succès de l’API.
- Authentification des routes par cookie ; les en-têtes Bearer ne sont plus acceptés.
- Protection CSRF des mutations : origine exacte configurée et en-tête `X-CSRF-Protection: 1`, CORS limité à cette origine avec credentials.
- Réponses non mises en cache. Limitation de débit sur connexion et inscription.
- Conservation de la destination QR si une reconnexion est nécessaire ; retrait du fragment après succès du check-in.

## Validation locale

- 106 tests backend unitaires et HTTP réussis, dont 7 tests de sessions et CSRF.
- 22 tests frontend réussis : connexion sans stockage, restauration, déconnexion, pannes et réponse de restauration tardive.
- 15 tests d’intégration PostgreSQL réussis sur une base temporaire isolée.
- 2 parcours Chromium réussis : cookie HttpOnly, absence dans `document.cookie` et `localStorage`, rechargement, réservation, annulation, déconnexion, accès protégé après déconnexion ; invitation et check-in QR.
- Types backend et Svelte : aucune erreur ni avertissement.
- Compilation de production, lint et vérification du formatage réussis.

Les parcours navigateur ont utilisé PostgreSQL réel et une API démarrée normalement.
MongoDB était indisponible dans cet environnement isolé : les annulations ont exercé
le fonctionnement « best effort », sans valider la persistance des journaux MongoDB.
Les attributs HTTPS du cookie sont testés côté HTTP ; le navigateur local utilise HTTP.
Aucun déploiement ni résultat de CI distante n’est revendiqué par cette vérification.

## Conditions de déploiement et limites

Frontend et API doivent utiliser HTTPS et appartenir au même site au sens du navigateur
(par exemple `app.example.com` et `api.example.com`). Des domaines indépendants ne
conviennent pas à `SameSite=Strict`. Le README détaille la configuration et les appels CLI.
Les sessions localStorage existantes nécessitent une nouvelle connexion.

Le JWT reste sans état côté serveur : supprimer le cookie ne révoque pas une copie du
jeton, et les rôles contenus dans le JWT restent valables jusqu’à expiration.
Le cookie empêche la lecture du jeton par JavaScript, mais une faille XSS pourrait
encore effectuer des actions avec les droits du compte.

La protection CSRF suit le principe des en-têtes personnalisés pour les API AJAX,
avec validation stricte des origines, décrit dans la
[fiche OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
