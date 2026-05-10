# AGENTS.md — Biblioteca de Alejandría

## Project location

The Next.js app lives in `/` (workspace root).

## Developer commands

```bash
pnpm install   # Install dependencies
pnpm dev        # Start dev server on http://localhost:3000
pnpm build      # Production build
pnpm start      # Start production server
pnpm lint       # ESLint (no --fix by default — run manually if needed)
pnpm exec playwright test   # Run E2E tests
```

## Required setup order

1. `pnpm install`
2. Create `.env.local` with the variables listed in Readme.md (Supabase URL/keys, Gmail SMTP, Google Maps key, SITE_URL)
3. Run the contents of `supabase/seed.sql` in the Supabase SQL Editor to create the ROOT user
4. `pnpm dev`

## Architecture (Service-Repository, 4 layers)

```
View (components/, "use client") → Actions (app/**/actions.ts, "use server")
  → Services (services/**/) → Models (models/**/) → Supabase
```

Rules:
- Actions never import directly from `models/` (except atomic ops like `signIn`)
- Models never call other models
- Services never access Supabase directly — always through a Model
- Rollback is the Service's responsibility
- Shared types live in `lib/types/` — never inline in Models or Actions

## Styling — Tailwind v4

Colors and fonts are defined as `@theme` tokens in `app/globals.css`. **Do not use hex color codes in components.** Use the token names:
`brand-primary`, `brand-secondary`, `brand-accent`, `brand-bg`, `brand-text`.

Fonts are configured in `lib/fonts.ts`.

## Supabase types

`lib/types/supabase.ts` is auto-generated. **Do not edit manually.** Regenerate with:

```bash
supabase gen types typescript --project-id <project-id> > lib/types/supabase.ts
```

## RBAC

Roles are stored in `auth.users.raw_app_meta_data.role` (not the `usuario` table). Roles: `ROOT`, `ADMINISTRADOR`, `CLIENTE`. Role changes require the `service_role` key.

Middleware (`proxy.ts`) enforces route protection with 4 layers: guest-only redirects, role-based access, onboarding guard, and session checks.

## Supabase migrations

Migrations live in `supabase/migrations/` and are numbered (`YYYYMMDD_*.sql`). Apply via Supabase CLI or SQL Editor. The seed for the initial ROOT user is in `supabase/seed.sql`.

## Playwright E2E

- Config: `playwright.config.ts` (tests in `./tests`)
- CI runs: `pnpm exec playwright install --with-deps && pnpm exec playwright test`
- Env vars for E2E (`.env`): `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_BASE_URL`

## No formatter / linter config files

No `.prettierrc`, `.eslintrc`, or similar files exist in the repo. ESLint uses Next.js defaults only.