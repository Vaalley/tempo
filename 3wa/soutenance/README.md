# Soutenance Tempo

## Fichiers

- `tempo-cda.md` : source Marp à modifier.
- `tempo-cda.html` : présentation à ouvrir dans un navigateur.
- `tempo-cda.pdf` : export pour la projection ou l’envoi au centre.
- `assets/` : logo du modèle, copies des diagrammes et captures. Garder ce dossier avec le Markdown et le HTML.

Le support reprend les dix parties du **Modèle soutenance CDA.pdf**. Il comporte 36 slides : la partie développement, la sécurité et le déploiement occupent plusieurs pages, comme le modèle le prévoit. Le format reste en 16:9, avec un fond blanc, des titres gris et le logo de la 3W Academy.

## À personnaliser

1. Renseigner la promotion sur la couverture.
2. Confirmer la date du 7 octobre 2026, reprise du dossier projet, avec la convocation.
3. Ajouter à l’oral les motivations du passage FSD/CDA et le bilan personnel. Les notes indiquent où les développer.
4. Ajuster la longueur après une répétition et selon la durée accordée par le centre.
5. Vérifier la CI du commit remis. La capture conservée prouve le succès du commit `8d0d1cd` le 23 septembre 2026, pas celui d’une version plus récente.

## Modifier et présenter

Dans VS Code, ouvrir le Markdown avec l’extension **Marp for VS Code** et activer le HTML dans les réglages de l’extension pour les dispositions en colonnes. Les commentaires `<!-- ... -->` contiennent les notes de présentation. Ils ne s’affichent pas sur les slides.

Le HTML s’ouvre directement dans un navigateur. Ses commandes permettent de passer en plein écran et en mode présentateur. Le PDF reste une solution de secours sans installation de Marp.

### Régénérer les exports

Depuis la racine du dépôt, avec Node.js et un navigateur Chromium ou Firefox installé :

```sh
npx @marp-team/marp-cli@4.5.1 3wa/soutenance/tempo-cda.md --html -o 3wa/soutenance/tempo-cda.html
npx @marp-team/marp-cli@4.5.1 3wa/soutenance/tempo-cda.md --html --pdf --allow-local-files -o 3wa/soutenance/tempo-cda.pdf
```

L’accès aux fichiers locaux permet à Marp de charger les images du dossier `assets`. N’utiliser cette option qu’avec une présentation de confiance.

Documentation : [Marp](https://marp.app/) et [Marp CLI](https://github.com/marp-team/marp-cli).

## Diagrammes et preuves

Les images UML et MERISE sont des copies des fichiers actuels de `diagrams/`. Chaque diagramme apparaît en entier sur une slide. Le lien « Ouvrir le diagramme complet dans un nouvel onglet » permet de l’agrandir dans le navigateur, puis de revenir à la présentation. Garder le dossier `assets/` à côté du HTML pour que ces liens fonctionnent.

Les légendes et les notes signalent les différences avec le code. Dans un lecteur PDF, l’ouverture des liens dépend des réglages du lecteur ; le nouvel onglet est prévu pour la présentation HTML.

Les extraits de code viennent du dépôt et restent du texte modifiable. Ils remplacent les captures de code proposées par le modèle. Les extraits partiels sont indiqués dans les notes.

Les captures fonctionnelles proviennent de la recette du 24 septembre 2026. La réservation associée au QR a été supprimée : ne pas tenter de l’utiliser pour une démonstration en direct.

### Sources utilisées

- Les deux dossiers ODT finaux, lus le 28 septembre 2026.
- `apps/backend/src/modules/bookings/bookings.route.ts` et `bookings.service.ts`.
- `apps/backend/src/modules/bookings/bookings.service.spec.ts`.
- `apps/backend/src/middlewares/auth.guard.ts`.
- `apps/backend/drizzle/0002_booking_overlap_constraint.sql`.
- `.github/workflows/ci.yml`.
- [Exécution CI n° 78](https://github.com/Vaalley/tempo/actions/runs/35839428413).

Aucune modification des dossiers ODT, de l’application ou des diagrammes d’origine n’est nécessaire pour utiliser ce support.
