import { Suspense } from "react";
import { getCurrentUser, VISITANTE } from "@/models/authModel";
import { Rol } from "@/lib/types/auth";
import NavbarClient from "./NavbarClient";

// ── Skeleton fallback while NavbarClient loads ──────────────────────
function NavbarSkeleton() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 bg-brand-text border-b-4 border-brand-primary">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-brand-bg/10 animate-pulse" />
        <div className="hidden sm:block w-48 h-5 rounded bg-brand-bg/10 animate-pulse" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-48 h-9 rounded-lg bg-brand-bg/10 animate-pulse" />
        <div className="w-9 h-9 rounded-lg bg-brand-bg/10 animate-pulse" />
      </div>
    </nav>
  );
}

// ── Navbar (Server Component) ───────────────────────────────────────
/**
 * Server Component que resuelve la sesión del usuario actual **una sola vez**
 * y deriva rol, email y estado de perfil para pasarlos al NavbarClient
 * envuelto en Suspense (requerido por useSearchParams en el buscador).
 */
export default async function Navbar() {
  const user = await getCurrentUser();

  // Derivar valores del único user object — evitamos waterfalls (data-patterns)
  const role = user
    ? (((user.app_metadata as Record<string, unknown>)?.role as Rol) ??
      VISITANTE)
    : VISITANTE;
  const email = user?.email ?? null;
  const profileComplete =
    (user?.app_metadata as Record<string, unknown>)?.profile_complete === true;

  // Derivar la etiqueta del badge según el rol
  const roleBadgeMap: Record<string, string> = {
    [Rol.ROOT]: "Usuario Root",
    [Rol.ADMINISTRADOR]: "Administrador",
    [Rol.CLIENTE]: "Cliente",
  };

  const roleBadge = roleBadgeMap[role] ?? null;

  return (
    <Suspense fallback={<NavbarSkeleton />}>
      <NavbarClient
        role={role}
        email={email}
        roleBadge={roleBadge}
        profileComplete={profileComplete}
      />
    </Suspense>
  );
}
