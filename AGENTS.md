# AGENTS.md — Biblioteca de Alejandría

> Instructions for AI coding agents working in this repository.

## Project Overview

| Aspect | Details |
|--------|---------|
| **Type** | E-commerce bookstore (Next.js App Router) |
| **Stack** | Next.js 16.1.6, React 19, TypeScript 5, Tailwind CSS 4, Supabase |
| **Language** | TypeScript with `strict: true` |
| **Package Manager** | pnpm |
| **App Location** | `biblioteca-alejandria/` |

The repository root contains product specifications in Spanish (`Readme.md`, `Casos de uso/`, `mockups/`).
The actual Next.js application lives in `biblioteca-alejandria/`.

---

## Build, Lint, and Test Commands

Run all commands from `biblioteca-alejandria/`:

```bash
# Development
pnpm dev          # Start dev server (Turbopack)

# Production
pnpm build        # Production build
pnpm start        # Start production server

# Linting
pnpm lint         # Run ESLint (Next.js Core Web Vitals + TypeScript rules)
```

### Testing

**No test runner is configured.** Do not invent Jest/Vitest/Playwright commands.
When tests are added, this section will be updated with single-test commands.

---

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** — all code must pass `strict: true` checks
- **Explicit types** — prefer explicit return types on exported functions
- **Interfaces over types** — use `interface` for object shapes, `type` for unions/primitives
- **No `any`** — use `unknown` and narrow with type guards when needed

```typescript
// Correct: explicit interface, typed parameters
interface LoginState {
  error?: string;
  success?: boolean;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> { ... }
```

### Imports

- **Path alias**: use `@/*` for imports from project root
- **Order**: React/Next → external packages → internal modules → types
- **Direct imports**: avoid barrel files for large libraries (use `lucide-react/dist/esm/icons/check`)

```typescript
// Correct import order
import { useActionState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ROLES } from "@/lib/auth/roles";
import type { LoginState } from "./actions";
```

### Components

- **Default exports** for page/layout components and reusable UI components
- **Named exports** for utilities, hooks, and types
- **File naming**: PascalCase for components (`LoginForm.tsx`), camelCase for utilities (`roles.ts`)
- **Props interface**: define above component, extend HTML attributes when wrapping native elements

```typescript
// UI component pattern
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export default function Button({ children, variant = "primary", className, ...props }: ButtonProps) {
  // ...
}
```

### Server vs Client Components

- **Server Components** (default): data fetching, database access, sensitive operations
- **Client Components**: add `"use client"` at top for interactivity, hooks, browser APIs
- **Server Actions**: add `"use server"` for form handlers and mutations

```typescript
// Server Action pattern
"use server";

export async function registerUser(data: FormData): Promise<RegisterResponse> {
  const supabase = await createClient();
  // ... validation, database operations, error handling
}
```

### Error Handling

- **Return error objects** from Server Actions, don't throw (use `{ error: string }` pattern)
- **User-friendly messages** in Spanish for UI errors
- **Console logging** for debugging with `console.error()`
- **Try-catch** for database operations with rollback logic

```typescript
// Error handling pattern
if (authError) {
  console.error("Error al registrar:", authError);
  return { success: false, errors: { correo: "Este correo ya está registrado." } };
}
```

### Formatting & Styling

- **Tailwind CSS**: use utility classes, leverage brand color tokens (`brand-primary`, `brand-secondary`, etc.)
- **Template literals** for conditional classes with `${condition ? "class" : ""}`
- **No CSS-in-JS**: use Tailwind utilities or `globals.css` for custom styles

```typescript
// Tailwind pattern with brand colors
className={`px-4 py-2 rounded-lg border
  ${hasError
    ? "border-red-500 focus:ring-red-400/60"
    : "border-brand-secondary focus:ring-brand-accent/60"
  }`}
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `LoginForm`, `ActionCard` |
| Files (components) | PascalCase.tsx | `Button.tsx`, `RootNavbar.tsx` |
| Files (utilities) | camelCase.ts | `roles.ts`, `server.ts` |
| Interfaces/Types | PascalCase | `LoginState`, `ButtonProps` |
| Constants | SCREAMING_SNAKE | `ROLES`, `VISITANTE` |
| Functions | camelCase | `createClient`, `getRoleFromJwtClaims` |
| CSS classes | kebab-case | `grainy-glass`, `brand-primary` |

---

## Domain Conventions

### Language

- **Documentation and UI**: Spanish
- **Code identifiers**: English (variable names, function names)
- **Domain nouns**: Use Spanish terms from PRD (`Libro`, `Copia`, `Tienda`, `Devolucion`, `Auditoria`)

### Roles

Four domain roles defined in `lib/auth/roles.ts`:

```typescript
const ROLES = { ROOT: "ROOT", ADMINISTRADOR: "ADMINISTRADOR", CLIENTE: "CLIENTE" };
const VISITANTE = "VISITANTE"; // unauthenticated user
```

### Use Case Files

Located in `Casos de uso/` with naming pattern: `CU-{nn}_{PascalCaseName}.md`

Maintain the established structure: Definición del actor, Identificador, Historia de revisiones, Flujo Normal, Flujos alternativos, Excepciones.

---

## Performance Guidelines

Reference `.agents/skills/vercel-react-best-practices/` for React/Next.js optimization rules:

**Critical priorities:**
- Eliminate waterfalls — use `Promise.all()` for parallel fetches
- Bundle optimization — use `next/dynamic` for heavy components, import directly (no barrels)
- Server-side — use `React.cache()` for deduplication, minimize RSC serialization

**Example: parallel data fetching**
```typescript
// Correct: parallel execution
const [user, config] = await Promise.all([fetchUser(), fetchConfig()]);

// Incorrect: sequential (waterfall)
const user = await fetchUser();
const config = await fetchConfig();
```

---

## Quick Reference

### Do

- Use `@/*` path alias for all internal imports
- Add `"use client"` only when needed (hooks, interactivity)
- Return error objects from Server Actions with Spanish messages
- Follow existing component patterns in `components/ui/`
- Keep TypeScript strict — no `any`, explicit types on exports

### Don't

- Don't create test files until a test runner is configured
- Don't use barrel imports for icon libraries
- Don't throw errors in Server Actions (return error state instead)
- Don't add English user-facing text (keep UI in Spanish)
- Don't bypass TypeScript with `// @ts-ignore`

---

## Related Documentation

- **Product spec**: `Readme.md` (PRD with requirement IDs)
- **Use cases**: `Casos de uso/` (detailed interaction flows)
- **Copilot instructions**: `.github/copilot-instructions.md`
- **React best practices**: `.agents/skills/vercel-react-best-practices/SKILL.md`
