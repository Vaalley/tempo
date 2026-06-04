# AGENTS.md - AI Guide

Tempo = flex-office SaaS. Book desks/rooms, monitor occupancy.

**Stack**: Bun + Hono (API) + Svelte 5 (UI) + Drizzle + PostgreSQL + MongoDB + shadcn-svelte + Tailwind 4

---

## Commands

**Root:**

```bash
bun run dev          # all workspaces
bun run build
bun run test
bun run lint         # oxlint
bun run format       # oxfmt
bun run precommit    # fmt + lint + test
```

**Backend** (`apps/backend`):

```bash
bun run dev          # :3000 hot reload
bun test             # all tests
bun test --watch
bun test src/path/to/file.spec.ts
```

**Frontend** (`apps/frontend`):

```bash
bun run dev          # :5173
bun run build
bun run check        # svelte-check
bun run test         # vitest
```

---

## Style

- **Tabs** width 4 (`.oxfmtrc.json`)
- Single quotes
- `camelCase` vars/fns
- `PascalCase` types/classes
- `kebab-case.ts` files
- `snake_case` DB tables
- Strict TS: explicit types, `verbatimModuleSyntax` → `import type {...}`

---

## Structure

```
apps/backend/src/
├── modules/
│   ├── auth/           # auth.route.ts (HTTP), auth.service.ts (logic), auth.dto.ts (Zod), auth.service.spec.ts
│   ├── bookings/
│   ├── users/
│   └── workspaces/
├── db/
│   ├── schema.ts       # Drizzle tables
│   ├── index.ts        # DB conn
│   └── mongo.ts        # audit logs
├── middleware/auth.ts  # JWT middleware
└── index.ts            # AppType export

apps/frontend/src/
├── lib/
│   ├── components/ui/  # shadcn (button, card, input, select, table, badge, alert...)
│   ├── client.ts       # Hono RPC client
│   ├── utils.ts        # cn() Tailwind helper
│   └── auth.ts         # auth store
└── routes/             # SvelteKit file routing
```

---

## Env

**Backend**:

```bash
DATABASE_URL=postgres://admin:password123@localhost:5432/tempo_db
MONGO_URL=mongodb://admin:password123@localhost:27017
MONGO_DB_NAME=tempo_audit
JWT_SECRET=change-me-prod
```

**Frontend**:

```bash
PUBLIC_API_URL=http://localhost:3000
```

---

## Patterns

**Imports**:

```typescript
import type { AppType } from '@tempo/backend/src/index';  // type only
import { db } from '../../db';                           // value
```

**Auth**:

- JWT via `hono/jwt`
- Hash: `Bun.password.hash/verify`
- Store JWT `localStorage` frontend

**Error handling** (routes):

```typescript
app.post('/path', zValidator('json', schema), async (c) => {
  try {
    const data = c.req.valid('json');
    const result = await service.fn(data);
    return c.json(result, 201);
  } catch (e) {
    if (e.message === 'USER_EXISTS') return c.json({ error: 'Email taken' }, 409);
    return c.json({ error: 'Server error' }, 500);
  }
});
```

**Svelte 5 runes**:

```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
  $effect(() => console.log(count));
</script>
```

**Hono RPC client**:

```typescript
import { hc } from 'hono/client';
import type { AppType } from '@tempo/backend/src/index';
const client = hc<AppType>('http://localhost:3000/');
const res = await client.api.auth.login.$post({ json: { email, password } });
```

**UI (shadcn)**:

```svelte
<script>
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
</script>
```

**Test (Bun Test backend, Vitest frontend)**:

```typescript
describe('Service', () => {
  beforeEach(() => mockReset());
  it('should throw X', async () => {
    mockFn.mockResolvedValue({ id: '1' });
    await expect(service.fn()).rejects.toThrow('ERROR_CODE');
  });
});
```

**DB migrations**:

```bash
cd apps/backend
bunx drizzle-kit generate
bunx drizzle-kit migrate
```

---

## Docker

```bash
docker compose up -d postgres mongo   # DBs only
docker compose up --build             # full stack
```

| Service  | Port  |
| -------- | ----- |
| postgres | 5432  |
| mongo    | 27017 |
| backend  | 3000  |
| frontend | 5173  |

---

## Key Files

| File                              | Purpose                                                         |
| --------------------------------- | --------------------------------------------------------------- |
| `package.json`                    | workspace config                                                |
| `apps/backend/src/index.ts`       | entry + AppType                                                 |
| `apps/backend/src/db/schema.ts`   | Drizzle schema                                                  |
| `apps/frontend/src/lib/client.ts` | Hono client                                                     |
| `apps/frontend/src/lib/utils.ts`  | cn() helper                                                     |
| `.oxlintrc.json`                  | lint rules (correctness=error, suspicious=warn, no-console=off) |
| `.oxfmtrc.json`                   | fmt rules (tabs, width 4, singleQuote)                          |
| `docker-compose.yml`              | services                                                        |
| `apps/frontend/components.json`   | shadcn config                                                   |

---

## Checklist

- [ ] `bun run format && bun run lint` before done
- [ ] Tests pass
- [ ] Type-safe Hono RPC (`AppType`)
- [ ] Route→service→DB separation
- [ ] Zod validation all inputs
- [ ] Proper HTTP status codes
- [ ] Svelte 5 runes (not old syntax)
