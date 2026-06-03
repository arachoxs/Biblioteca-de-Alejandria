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
  Menu,
  ShoppingCart,
  MessageSquare,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Rol } from "@/lib/types/auth";
import { globalSignOutAction } from "@/app/actions/authActions";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";
import MobileMenu from "@/components/MobileMenu";
import CartDrawer from "@/components/cart/CartDrawer";
import MensajeriaBadge from "@/components/mensajeria/MensajeriaBadge";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleMobileMenuClose = useCallback(() => setMobileMenuOpen(false), []);
  const handleOpenChangePwd = useCallback(() => setChangePwdOpen(true), []);

  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const currentQuery = searchParams.get("q") ?? "";
    setSearchValue((prev) => (prev !== currentQuery ? currentQuery : prev));
  }, [searchParams]);

  const isVisitor = role === "VISITANTE";

  const handleCartClick = useCallback(() => {
    if (isVisitor) {
      router.push("/login?redirect=%2Fcarrito");
      return;
    }
    setCartOpen(true);
  }, [isVisitor, router]);

  // ── Close desktop menu on outside click ───────────────────────────
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Close desktop menu on Escape ──────────────────────────────────
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
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-secondary hover:text-brand-text hover:bg-brand-bg rounded-lg transition-all text-left cursor-pointer group"
            onClick={() => {
              setChangePwdOpen(true);
              setMenuOpen(false);
            }}>
            <KeyRound className="w-5 h-5 text-brand-secondary group-hover:text-brand-text transition-colors" />
            Cambiar contraseña
          </button>
        )}

        {(role === Rol.ADMINISTRADOR || role === Rol.CLIENTE) && (
          <Link
            href={
              role === Rol.ADMINISTRADOR && !profileComplete
                ? "/completar-perfil"
                : "/perfil"
            }
            ref={firstMenuItemRef as React.Ref<HTMLAnchorElement>}
            role="menuitem"
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-secondary hover:text-brand-text hover:bg-brand-bg rounded-lg transition-all text-left cursor-pointer group"
            onClick={() => setMenuOpen(false)}>
            <UserCircle className="w-5 h-5 text-brand-secondary group-hover:text-brand-text transition-colors" />
            {role === Rol.ADMINISTRADOR && !profileComplete
              ? "Completar perfil"
              : "Ver perfil"}
          </Link>
        )}

        {role === Rol.CLIENTE && (
          <Link
            href="/mensajeria"
            role="menuitem"
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-secondary hover:text-brand-text hover:bg-brand-bg rounded-lg transition-all text-left cursor-pointer group"
            onClick={() => setMenuOpen(false)}>
            <div className="relative flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-brand-secondary group-hover:text-brand-text transition-colors" />
              <span>Mensajería</span>
              <MensajeriaBadge size="sm" />
            </div>
          </Link>
        )}

        <button
          role="menuitem"
          onClick={() => globalSignOutAction()}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-primary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all text-left cursor-pointer group">
          <LogOut className="w-5 h-5 text-brand-primary/90 group-hover:text-brand-primary transition-colors" />
          Cerrar sesión
        </button>
      </>
    );
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-10 py-4 bg-brand-text border-b-4 border-brand-primary">
      {/* ── Brand ─────────────────────────────────────────────────── */}
      <Link
        href="/"
        className="flex items-center gap-3 text-brand-bg hover:opacity-90 transition-opacity">
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

      {/* ── Center: Search (hidden if admin hasn't completed profile) ── */}
      {!(role === Rol.ADMINISTRADOR && !profileComplete) && (
        <div className="flex flex-1 justify-center px-2 sm:px-4">
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

      {/* ── Right section (desktop) ────────────────────────────────── */}
      <div className="hidden md:flex items-center gap-3">
        {/* Cart button — solo para CLIENTE y VISITANTE */}
        {role !== Rol.ADMINISTRADOR && role !== Rol.ROOT && (
          <button
            type="button"
            onClick={handleCartClick}
            className="p-2 rounded-lg bg-brand-bg/5 hover:bg-brand-bg/10 border border-transparent hover:border-brand-accent/30 transition-all text-brand-accent cursor-pointer"
            aria-label="Carrito de compras"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        )}

        {/* Panel Buttons — role-specific */}
        {role === Rol.ROOT && (
          <Link
            href="/panel-root"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium tracking-wide text-brand-accent bg-brand-accent/10 hover:bg-brand-accent/20 rounded-lg border border-brand-accent/20 transition-colors">
            <Crown className="w-4 h-4" />
            Panel Root
          </Link>
        )}

        {role === Rol.ADMINISTRADOR && profileComplete && (
          <Link
            href="/panel-admin"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium tracking-wide text-brand-accent bg-brand-accent/10 hover:bg-brand-accent/20 rounded-lg border border-brand-accent/20 transition-colors">
            <ShieldCheck className="w-4 h-4" />
            Panel Administración
          </Link>
        )}

        {/* Role Badge */}
        {roleBadge && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-brand-accent/15 rounded-full border border-brand-accent/20">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-primary ring-2 ring-brand-primary/30" />
            <span className="text-brand-accent text-xs font-medium tracking-wide">
              {roleBadge}
            </span>
          </div>
        )}

        {/* ── Visitor: sign in buttons ────────────────────────────── */}
        {isVisitor && (
          <div className="flex items-center gap-2">
            <Link
              href="/register"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-secondary hover:bg-brand-secondary/90 rounded-lg shadow-sm transition-colors cursor-pointer">
              <UserPlus className="w-4 h-4" />
              Registrarse
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 rounded-lg shadow-sm transition-colors cursor-pointer">
              <LogIn className="w-4 h-4" />
              Iniciar sesión
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
              className="relative flex items-center gap-2 p-2 rounded-lg bg-brand-bg/5 hover:bg-brand-bg/10 border border-transparent hover:border-brand-accent/30 transition-all text-brand-accent cursor-pointer"
              aria-label="Menú de usuario"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls="user-menu">
              <User className="w-5 h-5" />
              {role === Rol.CLIENTE && (
                <MensajeriaBadge size="sm" className="absolute -top-1 -right-1" />
              )}
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
                className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-brand-accent/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Header */}
                <div className="px-4 py-3 bg-brand-bg border-b border-brand-accent/20">
                  <p className="text-sm font-medium text-brand-text truncate">
                    {email}
                  </p>
                  <p className="text-xs text-brand-secondary font-medium mt-0.5">
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

      {/* ── Mobile: Cart + Hamburger ──────────────────────────────── */}
      <div className="flex md:hidden items-center gap-1">
        {role !== Rol.ADMINISTRADOR && role !== Rol.ROOT && (
          <button
            type="button"
            onClick={handleCartClick}
            className="flex items-center rounded-lg text-brand-accent hover:bg-brand-bg/10 transition-colors cursor-pointer p-1.5"
            aria-label="Carrito de compras"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        )}
        <button
          ref={mobileMenuTriggerRef}
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex items-center rounded-lg text-brand-accent hover:bg-brand-bg/10 transition-colors cursor-pointer"
          aria-label="Abrir menú de navegación"
          aria-expanded={mobileMenuOpen}>
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* ── Mobile Menu Drawer ────────────────────────────────────── */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        triggerRef={mobileMenuTriggerRef}
        onOpenChangePwd={handleOpenChangePwd}
        role={role}
        email={email}
        roleBadge={roleBadge}
        profileComplete={profileComplete}
      />

      {/* ── Cambiar Contraseña Modal ─────────────────────────────── */}
      <ChangePasswordModal
        isOpen={changePwdOpen}
        onClose={() => setChangePwdOpen(false)}
      />

      {/* ── Cart Drawer ────────────────────────────────────────────── */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </nav>
  );
}
