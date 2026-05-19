# AGENTS.md — Biblioteca de Alejandría

## Project

Next.js 16 app (App Router, Server Actions) + Supabase (Auth + Postgres + RLS).

**Root is the project root** — no subdirectory. No automated tests.

## Developer Commands

```bash
pnpm install          # Install deps
pnpm dev              # Dev server localhost:3000
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # ESLint (no --fix)
```

## Setup Required Before Dev

1. Create `.env.local` (NOT `.env`) — env vars template in README, no `.env.example` exists.
2. Run `supabase/seed.sql` in Supabase SQL Editor → creates ROOT user.
3. `pnpm dev`

## Architecture (4 layers, strict)

```
Components → Actions (app/**/actions.ts "use server")
  → Services (services/**/*Service.ts) → Models (models/*Model.ts) → Supabase
```

Every layer has a single responsibility. Never skip a layer.

### Layer rules

- **Models** (`models/*Model.ts`) — atomic CRUD/Auth ops. Must import `"server-only"`. Access Supabase via `lib/supabase/server.ts`. Never call other models.
- **Services** (`services/**/*Service.ts`) — orchestrate use cases across models. Handle rollback. Access Supabase only through Models.
- **Actions** (`app/**/actions.ts`) — validate & sanitize input, delegate to Services. Never import from `models/` except atomic ops like `signIn`.
- **Components** (`components/`) — render UI, call Server Actions. Keep small, focused, composable.

### Supabase clients (`lib/supabase/server.ts`)

| Client | Uses | Scope |
|---|---|---|
| `createClient()` | anon key + cookies | SSR with user context (default for models) |
| `createPublicClient()` | anon key, no cookies | Public read-only queries |
| `createAdminClient()` | service_role key | Bypasses RLS — **server-only**, never expose to client |

### Key directories

- `lib/types/` — all shared types. `supabase.ts` is auto-generated, never edit manually.
- `lib/validations/` — `rules.ts` is the single source of validation constants and composable rules. Domain validators in named files. `server-auth.ts` has role guards (`requireRootRole`, `isCurrentUserRoot`, etc.).
- `lib/services/` — infrastructure utilities (email, crypto, errors). NOT business logic — that's `services/`.
- `hooks/` — `useDebounce`, `useValidation`.

### Shared utilities

- `getErrorMessage(error)` from `lib/services/errors.ts`
- `sanitizeText`, `validateRequiredString`, `validateEmail` from `lib/validations/rules.ts`
- `escapeLikePattern`, `buildOrILikeFilter` from `lib/validations/db-utils.ts` for safe ILIKE queries

## Styling — Tailwind v4

Colors via `@theme` tokens in `app/globals.css`. **Never use hex codes.**
Tokens: `brand-primary`, `brand-secondary`, `brand-accent`, `brand-bg`, `brand-text`.

Fonts in `lib/fonts.ts` (Geist Sans, Geist Mono, Cormorant Garamond).

## RBAC

Roles in `auth.users.raw_app_meta_data.role` (NOT in `usuario` table): `ROOT`, `ADMINISTRADOR`, `CLIENTE`. Sentinel `VISITANTE` (`"VISITANTE"`) for unauthenticated — never persisted.

Middleware: `proxy.ts` (root) → `lib/supabase/proxy.ts`. 5 protection layers:
1. Guest-only routes redirect authed users to `/`
2. Role-protected: `/panel-root` → ROOT, `/panel-admin` → ADMINISTRADOR
3. Onboarding guard: incomplete admins forced to `/completar-perfil`
4. `/perfil` guard: requires session, ROOT redirected away
5. Banned users: forced sign-out, redirect to `/login?banned=true`

**Critical**: Server Actions (POST with `next-action` header) are never redirected by middleware.

Role changes require `service_role` key.

## Supabase

Types auto-generated in `lib/types/supabase.ts`. **Do not edit manually.** Regenerate:
```bash
supabase gen types typescript --project-id <project-id> > lib/types/supabase.ts
```

Migrations: `supabase/migrations/` (numbered `YYYYMMDD_*.sql`). Seed: `supabase/seed.sql`.

## No formatter / linter config files

ESLint uses Next.js defaults. No `.prettierrc`, `.eslintrc`, etc.

## CI / Deployment

- Vercel: set **Root Directory to `.`** (not `biblioteca-alejandria`)
- No GitHub Actions workflows configured
