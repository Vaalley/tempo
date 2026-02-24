# AGENTS.md - Guide for AI Agents

This file provides guidelines for AI agents working in this repository.

---

## Project Overview

**Tempo** is a SaaS application for managing workspaces (flex-office). It allows employees to book desks or meeting rooms and administrators to monitor space occupancy.

- **Stack**: Bun + Hono (Backend) + Svelte 5 (Frontend) + Drizzle ORM + PostgreSQL + MongoDB
- **Monorepo**: Bun Workspaces (`apps/backend`, `apps/frontend`)
- **Language**: TypeScript (strict mode enabled)

---

## Build, Lint, and Test Commands

### Root Commands (Monorepo)

```bash
bun run dev          # Start all workspaces in parallel
bun run build        # Build all workspaces
bun run test         # Run all tests
bun run lint         # Run oxlint
bun run format       # Run oxfmt
bun run format:check # Check formatting without changes
bun run precommit    # format + lint + test
```

### Backend Commands

```bash
cd apps/backend
bun run dev          # Start with hot reload (port 3000)
bun test             # Run all tests
bun test --watch     # Run tests in watch mode
bun test <file>      # Run single test file
```

### Frontend Commands

```bash
cd apps/frontend
bun run dev          # Start dev server (port 5173)
bun run build        # Build for production
bun run check        # Svelte type checking
bun run check:watch  # Watch mode for type checking
bun run test         # Run Vitest tests
bun run test:unit    # Run Vitest in watch mode
```

### Running a Single Test

```bash
# Backend (using bun test with file path)
bun test src/modules/auth/auth.service.spec.ts

# Frontend (using vitest with file path)
bun test src/lib/auth.spec.ts

# Or using vitest directly in frontend
cd apps/frontend && npx vitest run src/lib/auth.spec.ts
```

---

## Code Style Guidelines

### Formatting

- **Use Tabs** with width 4 (configured in `.oxfmtrc.json`)
- **Use single quotes** for strings
- Run `bun run format` before committing

### TypeScript

- **Strict mode** is enabled in `tsconfig.json`
- Always use explicit types for function parameters and return types
- Enable strict checks: `noUncheckedIndexedAccess`, `noImplicitOverride`
- Use `verbatimModuleSyntax` - must use `import type` for types only

### Imports

```typescript
// Type-only imports (required with verbatimModuleSyntax)
import type { AppType } from '@tempo/backend/src/index';
import type { User } from './types';

// Value imports
import { db } from '../../db';
import { authService } from './auth.service';

// Relative paths for local imports, package imports for external
```

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `auth.service.ts`, `users.route.ts`)
- **Variables/Functions**: `camelCase`
- **Classes/Types**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE` for configuration constants
- **Database Tables**: `snake_case` (e.g., `users`, `workspaces`)

### Project Structure (Backend)

```
apps/backend/src/
├── modules/
│   └── auth/
│       ├── auth.route.ts      # Controller (HTTP)
│       ├── auth.service.ts    # Business logic
│       ├── auth.dto.ts        # Zod validation schemas
│       └── auth.service.spec.ts # Tests
├── db/
│   ├── schema.ts              # Drizzle schema
│   ├── index.ts               # DB instance
│   └── mongo.ts               # MongoDB connection
└── index.ts                   # App entry point
```

### Error Handling (Backend)

- Use **Zod** for request validation with `@hono/zod-validator`
- Throw descriptive errors in services: `throw new Error('USER_EXISTS')`
- Handle errors in routes with appropriate HTTP status codes:
    - `401` for authentication failures
    - `409` for conflicts (e.g., duplicate resources)
    - `500` for server errors

```typescript
// Example from auth.route.ts
app.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json');
    const user = await authService.register(email, password);
    return c.json(user, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_EXISTS') {
      return c.json({ error: 'Cet email est déjà utilisé' }, 409);
    }
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});
```

### Authentication

- Use JWT tokens via `hono/jwt`
- Password hashing with `Bun.password.hash` and `Bun.password.verify`
- Secrets from environment variables with defaults for development:
    ```typescript
    const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
    ```

### Database

- **PostgreSQL** with Drizzle ORM for structured data
- **MongoDB** for logs/audit (flexible schema)
- Use Drizzle migrations for schema changes
- Use relations for queries requiring joins

### Testing

- Use **Bun Test** for backend (`.spec.ts` files)
- Use **Vitest** for frontend
- Mock external dependencies (DB, services)
- Follow AAA pattern: **Arrange**, **Act**, **Assert**

```typescript
describe('AuthService', () => {
  beforeEach(() => {
    mockFindFirst.mockReset();
    // Reset mocks
  });

  it('should throw USER_EXISTS if email already exists', async () => {
    // Arrange
    mockFindFirst.mockResolvedValue({ id: '123', email: 'test@test.com' });

    // Act & Assert
    await expect(authService.register('test@test.com', 'pass')).rejects.toThrow('USER_EXISTS');
  });
});
```

### Frontend Guidelines

- Use **Svelte 5 Runes**: `$state`, `$derived`, `$effect`
- Use **Hono client** with type-safe RPC:
    ```typescript
    import { hc } from 'hono/client';
    import type { AppType } from '@tempo/backend/src/index';
    const client = hc<AppType>('http://localhost:3000/');
    ```
- Store JWT in `localStorage` for authenticated requests

### Linting Configuration

- **oxlint** is used (configured in `.oxlintrc.json`)
- Categories: `correctness` (error), `suspicious` (warn), `pedantic` (off), `style` (off)
- Console logging is allowed (`no-console: off`)

### Docker Development

```bash
# Start databases
docker compose up -d postgres mongo

# Full stack with Docker
docker compose up --build
```

---

## Key Files

| File                              | Purpose                        |
| --------------------------------- | ------------------------------ |
| `package.json`                    | Root workspace config          |
| `apps/backend/src/index.ts`       | Backend entry + AppType export |
| `apps/backend/src/db/schema.ts`   | Drizzle schema definitions     |
| `apps/frontend/src/lib/client.ts` | Hono client for frontend       |
| `.oxlintrc.json`                  | Linting rules                  |
| `.oxfmtrc.json`                   | Formatting rules               |
| `docker-compose.yml`              | Local development services     |

---

## Notes for AI Agents

1. **Always format and lint** before marking a task complete
2. **Run tests** to verify changes work correctly
3. **Use type-safe patterns** - import `AppType` for frontend-backend communication
4. **Follow the module structure** - route → service → db separation
5. **Handle errors gracefully** - return appropriate HTTP status codes
6. **Use Zod** for all input validation on the backend
