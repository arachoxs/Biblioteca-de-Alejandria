# AGENTS.md — Biblioteca de Alejandría

## Project
Next.js 16 app (App Router, Server Actions) + Supabase (Auth + Postgres + RLS).

**Root is the project root** — no subdirectory.

## Developer Commands

```bash
pnpm install          # Install deps
pnpm dev              # Dev server localhost:3000
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # ESLint (no --fix)
```

## Setup Required Before Dev

1. Create `.env.local` (NOT `.env`) with vars from README
2. Run `supabase/seed.sql` contents in Supabase SQL Editor → creates ROOT user
3. `pnpm dev`

## Architecture (4 layers, strict)

```
View (components/) → Actions (app/**/actions.ts) → Services (services/) → Models (models/) → Supabase
```

Rules:
- **Actions** never import from `models/` (except atomic ops like `signIn`)
- **Models** never call other models
- **Services** access Supabase only through a Model
- Rollback is the Service's responsibility
- Shared types go in `lib/types/` — never inline

## Styling — Tailwind v4

Colors via `@theme` tokens in `app/globals.css`. **Never use hex codes.** Tokens: `brand-primary`, `brand-secondary`, `brand-accent`, `brand-bg`, `brand-text`.

Fonts: `lib/fonts.ts` (Geist Sans, Geist Mono, Cormorant Garamond).

## RBAC

Roles in `auth.users.raw_app_meta_data.role` (not `usuario` table): `ROOT`, `ADMINISTRADOR`, `CLIENTE`.

`proxy.ts` is the middleware (4 protection layers: guest-only, role-based, onboarding guard, session).

Role changes require `service_role` key.

## Supabase

Types auto-generated: `lib/types/supabase.ts` — **do not edit manually**. Regenerate:
```bash
supabase gen types typescript --project-id <project-id> > lib/types/supabase.ts
```

Migrations: `supabase/migrations/` (numbered `YYYYMMDD_*.sql`). Seed: `supabase/seed.sql`.

## No formatter / linter config files

ESLint uses Next.js defaults only. No `.prettierrc`, `.eslintrc`, etc.

## CI / Deployment

- Vercel: set **Root Directory to `.`** (not `biblioteca-alejandria`)
- GitHub Actions workflows in `.github/workflows/`