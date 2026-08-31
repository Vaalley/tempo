# Tempo Frontend

Interface utilisateur pour Tempo, construite avec **Svelte 5** et **SvelteKit**.

## Stack

- **Framework** : Svelte 5 (Runes)
- **Meta-framework** : SvelteKit
- **Build** : Vite
- **Style** : Tailwind CSS
- **API Client** : Hono RPC Client
- **Tests** : Vitest

## Structure

```
src/
├── app.html              # Template HTML
├── lib/
│   ├── client.ts         # Client API (Hono RPC)
│   ├── authorized-api.ts # Requêtes protégées et gestion 401/403
│   ├── route-guard.ts    # Gardes de navigation USER/ADMIN
│   └── auth.svelte.ts    # Store d'authentification (Runes)
└── routes/
    ├── +layout.svelte    # Layout principal
    ├── +page.svelte      # Page d'accueil (liste users)
    └── login/
        └── +page.svelte  # Page de connexion
```

## Développement

```bash
# Depuis la racine du monorepo
bun install

# Lancer le backend d'abord
bun --filter @tempo/backend dev

# Lancer le frontend
bun run dev
```

Le frontend est disponible sur **http://localhost:5173**

La variable `PUBLIC_API_URL` est obligatoire et désigne l'URL publique du
backend, par exemple `http://localhost:3000`. Elle peut être définie dans le
fichier `.env` racine utilisé par Docker Compose ou dans l'environnement du
processus frontend.

## Scripts

| Commande          | Description                   |
| ----------------- | ----------------------------- |
| `bun run dev`     | Serveur de développement Vite |
| `bun run build`   | Build de production           |
| `bun run preview` | Preview du build              |
| `bun run test`    | Lance les tests Vitest        |
| `bun run check`   | Vérifie les types TypeScript  |

## Build de Production

```bash
bun run build
bun run preview
```

Le build utilise l'adapter Bun pour une compatibilité optimale avec le runtime.
