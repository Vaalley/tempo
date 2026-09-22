# Recette manuelle Tempo du 21 septembre 2026

## Conclusion

Les parcours principaux testés fonctionnent, avec des réserves d’interface et des vérifications finales inachevées. Cette recette ne permet pas de déclarer la livraison entièrement validée.

Application locale ouverte dans Helium à `http://localhost:5173/`, avec les comptes de démonstration ADMIN et USER fournis par le candidat. Le dépôt était modifié localement à partir de `af1755a` : les observations ne décrivent donc pas ce commit seul. Les données jetables autorisées portent le nom `RECETTE-2026-09-21`.

## Résultats observés

### Corrections apportées après la recette

Le 21 septembre, les bandeaux des cinq pages concernées ont été adaptés au retour à la ligne, y compris les longues adresses de compte. Les boutons de déconnexion ont reçu un nom accessible ; les champs de création de compte et d’espace ont aussi été nommés. Le formulaire de réservation refuse désormais, avant tout appel API, les dates invalides et les fins antérieures ou égales au début, avec un message explicite. La connexion du contrôle CI fournit maintenant `Origin` et `X-CSRF-Protection`.

Validation des corrections : Svelte sans erreur ni avertissement, 22 tests frontend et 7 tests de session/CSRF réussis, lint et formatage vérifiés. Le parcours E2E comporte désormais les deux cas de fin inversée ou égale ; il n’a pas été rejoué pendant cette correction. Le rendu mobile et la CI distante restent à revérifier. Les observations ci-dessous décrivent la recette avant correction ; l’harmonisation des dates affichées et la fin du nettoyage restent ouvertes.

| Contrôle                          | Résultat                                                                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Session ADMIN après rechargement  | Session conservée, accueil administrateur affiché.                                                                                                                 |
| Formulaires vides                 | Création désactivée lorsque les champs requis manquent.                                                                                                            |
| Créneau inversé                   | Création refusée, nombre de réservations inchangé ; message trop générique.                                                                                        |
| Création d’un espace              | Salle de recette créée avec une capacité de 2.                                                                                                                     |
| Réservation privée ADMIN          | Créée le 21 septembre de 09 h à 23 h sur la salle de recette.                                                                                                      |
| Chevauchement                     | Deuxième réservation refusée avec « Ce créneau est déjà réservé pour cet espace ».                                                                                 |
| Invitation USER                   | Invitation en attente visible ; propriétaire et invité occupent les deux places.                                                                                   |
| Réduction de capacité de 2 à 1    | Refus explicite ; capacité conservée à 2.                                                                                                                          |
| Augmentation de capacité de 2 à 3 | Modification enregistrée.                                                                                                                                          |
| Statistiques                      | 5 espaces, 5 réservations, 1 active, taux global de 20 %, salle de recette à 100 %. Ces indicateurs reposent sur les réservations, pas sur une mesure de présence. |
| Génération du QR                  | Image QR et commande de renouvellement affichées.                                                                                                                  |
| Déconnexion et accès anonyme      | Retour à la connexion ; accès administratif anonyme renvoyé vers la connexion.                                                                                     |
| Accès USER à l’administration     | Liens administratifs absents ; accès direct à `/admin/workspaces` renvoyé vers l’accueil.                                                                          |
| Invitation privée côté USER       | Actions Accepter et Refuser présentes ; annulation de la réservation d’autrui absente.                                                                             |
| QR avant acceptation              | Refus avec « L’invitation doit être acceptée avant le check-in ».                                                                                                  |
| Acceptation puis QR               | Présence confirmée à 09:56:51 ; fragment du lien retiré après traitement.                                                                                          |
| Réservation publique USER         | Création le 22 septembre de 09 h à 10 h, puis annulation vérifiée par disparition de la réservation et diminution du total de 6 à 5.                               |
| Journal d’audit                   | Six événements historiques chargés, ordonnés du plus récent au plus ancien. L’écriture des événements de cette recette n’a pas été vérifiée.                       |
| Affichage à 390 × 844             | Formulaire en une colonne ; bandeau supérieur débordant et commandes partiellement hors écran.                                                                     |

Le QR a été décodé depuis l’image affichée puis son lien ouvert dans le navigateur. Aucune caméra de téléphone n’a été testée. Les contrôles de rôles ci-dessus concernent l’interface ; les tests HTTP antérieurs apportent une preuve distincte pour l’API.

## Réserves à traiter

1. **Bandeau mobile.** À 390 pixels de large, l’adresse du compte et la déconnexion débordent. Permettre le retour à la ligne ou adapter la navigation, puis vérifier les deux rôles.
2. **Noms accessibles.** Sur les pages réservations, espaces, statistiques et audit, le bouton de déconnexion représenté par une icône n’a pas de nom accessible dans l’arbre consulté. Ajouter un libellé et vérifier les champs de formulaire, notamment la capacité.
3. **Erreur de dates.** Une fin antérieure au début produit « Erreur lors de la création de la réservation ». Afficher la règle attendue près des dates. Le refus métier fonctionne.
4. **Présentation des dates.** Certaines tables affichent `9/21/2026`, d’autres un format français. Harmoniser les dates explicitement formatées ; les champs natifs peuvent suivre la langue du navigateur.

Un point distinct a été trouvé par lecture de `.github/workflows/ci.yml` : la connexion dans `Verify Public Endpoints` ne fournit ni `Origin` ni `X-CSRF-Protection`. Le garde CSRF actuel exige ces en-têtes. Adapter ce contrôle avant de relancer la CI. Aucun nouvel échec distant n’est revendiqué : il s’agit d’un constat statique.

## Fin de recette et données restantes

La connexion ADMIN a été rétablie après les essais USER. L’annulation de la réservation ADMIN de recette a ensuite ouvert une confirmation. L’outil de contrôle du navigateur a cessé de répondre. Le candidat a indiqué avoir fermé la confirmation, mais les tentatives de relecture ont continué à expirer.

- L’annulation de la réservation USER est vérifiée.
- L’annulation de la réservation ADMIN reste à vérifier dans l’application.
- La suppression de l’espace `RECETTE-2026-09-21` n’a pas pu être effectuée.
- Les nouveaux audits de suppression restent à contrôler avant de conclure la recette.

Ne nettoyer que ces données de recette. Aucun espace préexistant n’a été modifié. Les erreurs de contrôle du navigateur ne constituent pas une preuve de panne de Tempo.

## Portée des preuves

Cette session ne vérifie pas les attributs du cookie dans les outils réseau, une restauration de sauvegarde, un déploiement Docker complet, la charge, les autres moteurs de navigateur ou une conformité d’accessibilité complète. La validation automatisée du 17 septembre est décrite séparément dans `CORRECTION_SESSION_HTTPONLY_2026-09-17.md` ; elle n’a pas été rejouée pendant cette passe documentaire.

Pour clôturer : corriger les réserves d’interface et le contrôle CI, reprendre le nettoyage et les audits, puis conserver une preuve de validation correspondant à la version réellement remise.
