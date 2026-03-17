# AGENTS.md — Biblioteca de Alejandría

Guidance for agentic coding agents working in this repository.

---

## Repository layout

```
/                          ← spec & documentation root (Spanish)
  Readme.md                ← PRD with all requirement IDs (RF-*, RNF-*)
  Requirements.md          ← supplementary requirements
  Casos de uso/            ← CU-{nn}_{PascalCaseName}.md use cases
  mockups/                 ← standalone HTML wireframes (UX reference only)
  docs/                    ← additional documentation
  biblioteca-alejandria/   ← Next.js 16 App Router application
```

All implementation work happens inside `biblioteca-alejandria/`. All domain
decisions, business rules, and user-facing copy come from the root docs.

---

## Build, lint, and test commands

All commands must be run from `biblioteca-alejandria/`:

```bash
pnpm dev          # start dev server (Next.js)
pnpm build        # production build
pnpm start        # start production server
pnpm lint         # run ESLint
```

**There is no test runner configured.** Do not invent Jest, Vitest, or
Playwright commands unless they are first added to `package.json`.

---

## Tech stack

- **Next.js 15+** (App Router) · **React 19** · **TypeScript 5** (strict)
- **Tailwind CSS v4** with PostCSS
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) for auth and DB
- **lucide-react** for icons
- **nodemailer** for transactional email
- **country-state-city** for location helpers
- Package manager: **pnpm**

---

## Project architecture

### Directory structure inside `biblioteca-alejandria/`

```
app/
  (auth)/           ← route group: login, register, password-recovery
  (panel)/          ← route group: panel-root, panel-admin
  layout.tsx        ← root layout (Geist fonts, global CSS)
  page.tsx          ← public storefront (home)
components/         ← shared React components
  ui/               ← generic UI primitives
lib/
  auth/             ← role helpers (roles.ts)
  services/         ← external service clients (email, Google Places)
  supabase/         ← Supabase client factories
    client.ts       ← browser client (createBrowserClient)
    server.ts       ← server client + admin client
    middleware.ts   ← middleware client (session refresh)
    types/          ← generated DB types (supabase.ts — do not hand-edit)
  types/            ← domain types (auth.ts, etc.)
models/             ← data-access layer (userModel.ts, etc.)
supabase/           ← Supabase migrations and seed files
```

### Supabase client usage rules

| Context | Import |
|---------|--------|
| Client Component | `createClient` from `@/lib/supabase/client` |
| Server Component / Server Action | `createClient` (async) from `@/lib/supabase/server` |
| Privileged server-only writes (bypasses RLS) | `createAdminClient` from `@/lib/supabase/server` — **never expose to browser** |
| Middleware | `createClient` from `@/lib/supabase/middleware` |

---

## Domain model

Four roles: `ROOT`, `ADMINISTRADOR`, `CLIENTE`, `VISITANTE`.

Key domain terms (use the Spanish names in code unless an English mapping already exists):

| Spanish | Meaning |
|---------|---------|
| `Libro` | Catalog title |
| `Copia` | Physical copy of a book |
| `Tienda` | Physical branch/store |
| `Reserva` | Reservation (max 5 active, expires 24 h) |
| `Devolucion` | Return, tracked via QR |
| `Auditoria` | Admin action audit log |
| `Noticia` | Public storefront entry (new books) |
| `Historico agotado` | Persistent out-of-stock label |

Business rules to preserve:
- Root creates admins with temporary credentials; admin onboarding is **blocking** until profile completion and password change.
- Only `CLIENTE` can buy or reserve. `ROOT`/`ADMINISTRADOR` cannot purchase.
- Inventory tracked per `Copia`; deleting a `Tienda` returns copies to global inventory.
- Requirement IDs (`RF-*`, `RNF-*`, `CU-*`) must remain traceable — do not rename or remove them in docs.

---

## Code style

### TypeScript

- Strict mode is enabled (`"strict": true` in `tsconfig.json`). Never use `any`
  unless interfacing with an untyped third-party API; annotate it with a comment.
- Prefer `interface` for object shapes, `type` for unions/aliases.
- Use `enum` for closed sets of domain constants (see `Rol`, `Genero` in
  `lib/types/auth.ts`). Use `as const` objects for non-enum lookup tables
  (see `ROLES` in `lib/auth/roles.ts`).
- Always provide explicit return types on exported functions.
- Use optional chaining and nullish coalescing; avoid non-null assertions (`!`)
  except for env vars at module scope where absence throws early.

### Imports

- Use the `@/*` path alias for all project-internal imports.
- External packages before internal imports; no explicit grouping comments needed.
- No default-and-named mixed imports from the same module on one line.

### Naming conventions

- **Files/directories**: `camelCase.ts` for modules, `PascalCase.tsx` for
  components, `kebab-case/` for route segments.
- **Components**: PascalCase function exported as default.
- **Server Actions files**: `actions.ts` at the route segment level.
- **Variables/functions**: camelCase.
- **Types/interfaces/enums**: PascalCase.
- **Constants**: UPPER_SNAKE_CASE for true constants; camelCase for `as const`
  objects used as lookup tables.

### React / Next.js

- Mark Client Components with `"use client"` at the top; mark Server Actions
  with `"use server"`.
- Place `export const metadata` in Server Components (not in Client Components).
- Keep heavy logic out of components — delegate to Server Actions (`actions.ts`)
  and model functions (`models/`).
- Use `next/image` for images and `next/link` for internal navigation.
- Destructure icon components from `lucide-react` individually (not as a namespace).

### Error handling

- Wrap multi-step DB operations in `try/catch`; return structured
  `{ success: false, errors: Record<string, string> }` objects — never throw
  across the Server Action boundary.
- Log errors with `console.error(description, error)` before returning.
- Perform manual rollback (delete created rows) when a multi-step write fails
  mid-way (see `userModel.ts` for the pattern).
- Map Supabase error codes/messages to user-friendly Spanish strings before
  returning them to the client.

### Styling

- Tailwind CSS utility classes only; no separate CSS files except `globals.css`.
- Use the `brand-*` color tokens (`brand-primary`, `brand-secondary`,
  `brand-accent`, `brand-text`, `brand-bg`) — do not hardcode hex values.
- Animation: prefer Tailwind's `animate-in`, `fade-in`, `slide-in-from-*`
  utilities with `fill-mode-both` for entrance animations.

---

## Language

- User-facing copy (UI text, validation messages, emails) and comments in
  domain logic: **Spanish**.
- New **product / user-facing documentation files** (e.g. PRD, Requirements,
  use cases, `/docs` content): **Spanish**.
- Internal technical guides and meta-documentation (e.g. `AGENTS.md`) may be
  written in **English**, as long as user-facing behavior and docs remain in
  Spanish.
- Technical identifiers (variable names, file names, function names): **English**
  unless an established domain term is already in Spanish in the codebase.
- Requirement IDs and use case references stay in their original form (`RF-*`,
  `CU-*`, etc.).

---

## Use case files (`Casos de uso/`)

Naming: `CU-{nn}_{PascalCaseName}.md`

Required sections (in order):
1. Definición del actor
2. Identificador del caso de uso
3. Historia de revisiones
4. Lista de casos de uso externos
5. Descripción del caso de uso
6. Flujo Normal
7. Flujos alternativos
8. Excepciones
9. Footer: Inclusiones / Extensiones · Prioridad

Flow steps use bold markers: `**1**`, `**3a**`, `**E1**`.
UML relations: `` `<<include>>` `` and `` `<<extend>>` `` followed by the referenced use case name.

---

## Environment variables

Required in `biblioteca-alejandria/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only, never expose to browser
```

Never commit `.env.local`. The `createAdminClient` function throws at runtime if
`SUPABASE_SERVICE_ROLE_KEY` is missing, so missing env vars surface immediately.
