"use client";

import Image from "next/image";
import Link from "next/link";
import {
  User,
  LogOut,
  KeyRound,
  ChevronDown,
  Search,
  Crown,
  ShieldCheck,
  UserCircle,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Rol } from "@/lib/types/auth";
import { globalSignOutAction } from "@/app/actions/authActions";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";

// ── Tipos ───────────────────────────────────────────────────────────

type NavbarRole = Rol | "VISITANTE";

interface NavbarClientProps {
  role: NavbarRole;
  email: string | null;
  roleBadge: string | null;
  profileComplete: boolean;
}

// ── Componente ──────────────────────────────────────────────────────

export default function NavbarClient({
  role,
  email,
  roleBadge,
  profileComplete,
}: NavbarClientProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchValue, setSearchValue] = useState(
    searchParams.get("q") ?? ""
  );

  useEffect(() => {
    const currentQuery = searchParams.get("q") ?? "";
    setSearchValue((prev) => (prev !== currentQuery ? currentQuery : prev));
  }, [searchParams]);

  const isVisitor = role === "VISITANTE";

  // ── Close menu on outside click ───────────────────────────────────
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Close menu on Escape ──────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        buttonRef.current?.focus();
      }
    }
    if (menuOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  // ── Auto-focus first menu item ────────────────────────────────────
  useEffect(() => {
    if (menuOpen && firstMenuItemRef.current) {
      setTimeout(() => firstMenuItemRef.current?.focus(), 0);
    }
  }, [menuOpen]);

  // ── Resolve brand link based on role ──────────────────────────────
  const brandHref =
    role === Rol.ROOT
      ? "/panel-root"
      : role === Rol.ADMINISTRADOR
        ? profileComplete
          ? "/panel-admin"
          : "/completar-perfil"
        : "/";

  // ── Search handler ────────────────────────────────────────────────
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchValue.trim();
    if (!trimmed) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", trimmed);
    router.push(`/?${params.toString()}`);
  }

  // ── Dropdown menu items by role ───────────────────────────────────
  function renderMenuItems() {
    return (
      <>
        {role === Rol.ROOT && (
          <button
            ref={firstMenuItemRef}
            role="menuitem"
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-brand-secondary hover:text-brand-text hover:bg-brand-accent/10 rounded-md transition-colors text-left cursor-pointer"
            onClick={() => {
              setChangePwdOpen(true);
              setMenuOpen(false);
            }}
          >
            <KeyRound className="w-4 h-4 text-brand-accent" />
            Cambiar contraseña
          </button>
        )}

        {(role === Rol.ADMINISTRADOR || role === Rol.CLIENTE) && (
          <Link
            href={role === Rol.ADMINISTRADOR && !profileComplete ? "/completar-perfil" : "/perfil"}
            ref={firstMenuItemRef as React.Ref<HTMLAnchorElement>}
            role="menuitem"
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-brand-secondary hover:text-brand-text hover:bg-brand-accent/10 rounded-md transition-colors text-left cursor-pointer"
            onClick={() => setMenuOpen(false)}
          >
            <UserCircle className="w-4 h-4 text-brand-accent" />
            {role === Rol.ADMINISTRADOR && !profileComplete ? "Completar perfil" : "Ver perfil"}
          </Link>
        )}

        <button
          role="menuitem"
          onClick={() => globalSignOutAction()}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-brand-primary hover:bg-brand-primary/10 rounded-md transition-colors text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </>
    );
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 bg-brand-text border-b-4 border-brand-primary">
      {/* ── Brand ─────────────────────────────────────────────────── */}
      <Link
        href={brandHref}
        className="flex items-center gap-3 text-brand-bg hover:opacity-90 transition-opacity"
      >
        <Image
          src="/logo-fondo-oscuro.png"
          alt="Biblioteca de Alejandría"
          width={40}
          height={40}
          className="shrink-0 drop-shadow-sm"
          priority
        />
        <span className="font-display text-xl font-semibold tracking-wide hidden sm:block">
          Biblioteca de Alejandría
        </span>
      </Link>

      {/* ── Center: Search (oculto si el admin no ha completado su perfil) ── */}
      {!(role === Rol.ADMINISTRADOR && !profileComplete) && (
        <div className="flex flex-1 justify-center px-1 sm:px-4">
          <form onSubmit={handleSearch} className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-accent/60 pointer-events-none" />
            <input
              type="search"
              name="q"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Buscar libros…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-brand-bg/10 text-brand-bg text-sm placeholder:text-brand-accent/40 border border-brand-accent/20 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/40 transition-all"
            />
          </form>
        </div>
      )}

      {/* ── Right section ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Panel Buttons — role-specific */}
        {role === Rol.ROOT && (
          <Link
            href="/panel-root"
            className="hidden md:flex items-center gap-2 px-3 py-2 text-xs font-medium tracking-wide text-brand-accent bg-brand-accent/10 hover:bg-brand-accent/20 rounded-lg border border-brand-accent/20 transition-colors"
          >
            <Crown className="w-4 h-4" />
            Panel Root
          </Link>
        )}

        {role === Rol.ADMINISTRADOR && profileComplete && (
          <Link
            href="/panel-admin"
            className="hidden md:flex items-center gap-2 px-3 py-2 text-xs font-medium tracking-wide text-brand-accent bg-brand-accent/10 hover:bg-brand-accent/20 rounded-lg border border-brand-accent/20 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Panel Administración
          </Link>
        )}

        {/* Role Badge — hidden on mobile */}
        {roleBadge && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-brand-accent/15 rounded-full border border-brand-accent/20">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-primary ring-2 ring-brand-primary/30" />
            <span className="text-brand-accent text-xs font-medium tracking-wide">
              {roleBadge}
            </span>
          </div>
        )}

        {/* ── Visitor: sign in button ─────────────────────────────── */}
        {isVisitor && (
          <div className="flex items-center gap-2">
            <Link
              href="/register"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-secondary hover:bg-brand-secondary/90 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Registrarse</span>
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Iniciar sesión</span>
            </Link>
          </div>
        )}

        {/* ── Authenticated user: dropdown menu ───────────────────── */}
        {!isVisitor && (
          <div className="relative" ref={menuRef}>
            <button
              id="user-menu-button"
              type="button"
              ref={buttonRef}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 p-2 rounded-lg bg-brand-bg/5 hover:bg-brand-bg/10 border border-transparent hover:border-brand-accent/30 transition-all text-brand-accent cursor-pointer"
              aria-label="Menú de usuario"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls="user-menu"
            >
              <User className="w-5 h-5" />
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {menuOpen && (
              <div
                id="user-menu"
                role="menu"
                aria-labelledby="user-menu-button"
                tabIndex={-1}
                className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-brand-accent/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
              >
                {/* Header */}
                <div className="px-4 py-3 bg-brand-bg/50 border-b border-brand-accent/10">
                  <p className="text-sm font-semibold text-brand-text truncate">
                    {email}
                  </p>
                  <p className="text-xs text-brand-secondary">
                    {roleBadge}
                  </p>
                </div>

                {/* Menu items */}
                <div className="p-2 flex flex-col gap-1">
                  {renderMenuItems()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modo universal de Cambiar Contraseña ── */}
      <ChangePasswordModal 
        isOpen={changePwdOpen} 
        onClose={() => setChangePwdOpen(false)} 
      />
    </nav>
  );
}
