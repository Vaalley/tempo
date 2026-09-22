# Tempo sur la machine partagee

Tout le projet est place dans `/opt/tempo`. Le fichier `compose.host.yml` est
autonome : ne pas le combiner avec `docker-compose.yml`, qui expose les bases
pour le developpement local.

## Preparation autorisee

Le transfert des secrets, le demarrage prive et l'utilisation de MongoDB 7.0.43
ont ete autorises, ainsi que la publication HTTPS sur `tempo-val.duckdns.org`.

```sh
cd /opt/tempo
docker compose --env-file deployment/host.env.example -f compose.host.yml config --quiet
docker compose --env-file deployment/host.env.example -f compose.host.yml build backend frontend
```

L'exemple d'environnement sert uniquement a valider et construire. Les secrets
necessaires ont ete transferes separement dans `.env.host`, avec des droits `600`.
Les images ne contiennent pas de fichiers `.env`.

## Demarrage et redemarrage

Le fichier `/opt/tempo/.env.host` existe et utilise `TEMPO_ORIGIN=https://tempo-val.duckdns.org`.
Ne pas le remplacer par l'exemple. Garder des mots de passe compatibles avec les
URL des bases et renseigner `TEMPO_ORIGIN` sans slash final.

MongoDB 8 refuse de demarrer avec le noyau Linux 7.0 de cette machine. Le fichier
`deployment/compose.mongo7.yml` selectionne MongoDB 7.0.43, initialise sur une
base vide. Toujours inclure ce fichier lors des demarrages et mises a jour.

```sh
cd /opt/tempo
docker compose --env-file .env.host -f compose.host.yml -f deployment/compose.mongo7.yml up -d --no-build --wait
```

Cette commande telecharge aussi les images PostgreSQL, MongoDB et Caddy si
necessaire. Les migrations PostgreSQL s'appliquent au demarrage du backend.
Aucun jeu de donnees de demonstration n'est charge automatiquement.

Seule la passerelle est publiee, sur `127.0.0.1:18080`. Les bases et les deux
applications restent dans le reseau Docker du projet. `/api/` est retire avant
transmission au backend. Le site public est `https://tempo-val.duckdns.org`.
Le proxy Caddy partage charge `/srv/tempo/caddy.conf`, une copie de
`deployment/public.caddy.conf`, via son import existant `/srv/*/caddy.conf`.
Il gere le certificat HTTPS et transmet les requetes au port local 18080.
La passerelle Docker fait confiance aux proxies du reseau prive et transmet
l'adresse client validee au backend pour la limitation des tentatives de connexion.
Les bases de donnees restent inaccessibles directement depuis Internet.

Les sauvegardes precedant HTTPS sont dans `deployment/before-https/` (droits 700),
y compris l'ancien environnement prive. Les certificats du domaine sont geres
dans le stockage du Caddy partage, hors de `/opt/tempo`.

## Donnees et suppression

Les donnees persistantes sont des dossiers sous `/opt/tempo/data`, y compris
les deux chemins de MongoDB et ceux de Caddy. Les journaux Docker sont limites
a trois fichiers de 10 Mo par service. Prevoir une sauvegarde hors machine
avant utilisation avec des donnees importantes.

Apres accord, retirer `/srv/tempo/caddy.conf` et son dossier vide, valider la
configuration `/srv/caddy/Caddyfile`, puis recharger Caddy (`systemctl reload caddy`).
Ne pas supprimer le stockage de certificats partage ni modifier les autres sites.
Arreter et retirer ensuite uniquement les conteneurs et le reseau Tempo :

```sh
cd /opt/tempo
docker compose --env-file .env.host -f compose.host.yml -f deployment/compose.mongo7.yml down
docker image rm tempo-backend:local tempo-frontend:local
```

Si aucun service n'a ete demarre et que `.env.host` n'existe pas, utiliser
`deployment/host.env.example` a sa place. Apres sauvegarde et verification du
chemin, le dossier `/opt/tempo` peut etre supprime. Cette suppression detruit les
donnees des bases. Ne jamais lancer de nettoyage Docker global sur cette machine
partagee. Les images de base et le cache de construction restent geres par Docker
hors du dossier ; ils peuvent etre partages avec d'autres projets.
