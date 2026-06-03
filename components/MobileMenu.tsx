"use client";

import Link from "next/link";
import {
  X,
  Crown,
  ShieldCheck,
  UserCircle,
  KeyRound,
  LogOut,
  LogIn,
  UserPlus,
  MessageSquare,
  Receipt,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Rol } from "@/lib/types/auth";
import { globalSignOutAction } from "@/app/actions/authActions";
import MensajeriaBadge from "@/components/mensajeria/MensajeriaBadge";

// ── Tipos ───────────────────────────────────────────────────────────

type NavbarRole = Rol | "VISITANTE";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  onOpenChangePwd: () => void;
  role: NavbarRole;
  email: string | null;
  roleBadge: string | null;
  profileComplete: boolean;
}

// ── Componente ──────────────────────────────────────────────────────

export default function MobileMenu({
  isOpen,
  onClose,
  triggerRef,
  onOpenChangePwd,
  role,
  email,
  roleBadge,
  profileComplete,
}: MobileMenuProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const panelRef = useRef<HTMLDivElement>(null);

  const isVisitor = role === "VISITANTE";

  const handleClose = () => {
    onClose();
    if (triggerRef?.current) {
      setTimeout(() => triggerRef.current?.focus(), 0);
    }
  };

  const prevPathnameRef = useRef(pathname);
  const prevSearchParamsRef = useRef(searchParams);

  // ── Auto-close on route change ──────────────────────────────────
  useEffect(() => {
    if (
      prevPathnameRef.current !== pathname ||
      prevSearchParamsRef.current !== searchParams
    ) {
      prevPathnameRef.current = pathname;
      prevSearchParamsRef.current = searchParams;
      onClose();
    }
  }, [pathname, searchParams, onClose]);

  // ── Lock body scroll ────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    document.body.style.overflow = "";
  }, [isOpen]);

  // ── Escape key ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menú de navegación"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-text/60 backdrop-blur-sm mobile-backdrop-in"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl mobile-panel-in flex flex-col"
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-brand-accent/10 bg-brand-bg/30">
          {!isVisitor && email ? (
            <div className="min-w-0">
              <p className="text-sm font-medium text-brand-text truncate">
                {email}
              </p>
              {roleBadge && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  <span className="text-xs text-brand-secondary font-medium">
                    {roleBadge}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <span className="font-display text-lg font-semibold text-brand-text tracking-wide">
              Menú
            </span>
          )}

          <button
            onClick={handleClose}
            className="p-2 -mr-2 rounded-lg text-brand-secondary hover:text-brand-text hover:bg-brand-accent/10 transition-all cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Navigation Links ─────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {/* ─ Visitor actions ─ */}
          {isVisitor && (
            <>
              <Link
                href="/login"
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-brand-secondary hover:text-brand-text hover:bg-brand-bg transition-all group"
                onClick={handleClose}
              >
                <LogIn className="w-5 h-5 text-brand-secondary group-hover:text-brand-text transition-colors" />
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-brand-secondary hover:text-brand-text hover:bg-brand-bg transition-all group"
                onClick={handleClose}
              >
                <UserPlus className="w-5 h-5 text-brand-secondary group-hover:text-brand-text transition-colors" />
                Registrarse
              </Link>
            </>
          )}

          {/* ─ Authenticated actions ─ */}
          {!isVisitor && (
            <>
              {role === Rol.ROOT && (
                <Link
                  href="/panel-root"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-brand-secondary hover:text-brand-text hover:bg-brand-bg transition-all group"
                  onClick={handleClose}
                >
                  <Crown className="w-5 h-5 text-brand-secondary group-hover:text-brand-text transition-colors" />
                  Panel Root
                </Link>
              )}

              {role === Rol.ADMINISTRADOR && profileComplete && (
                <Link
                  href="/panel-admin"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-brand-secondary hover:text-brand-text hover:bg-brand-bg transition-all group"
                  onClick={handleClose}
                >
                  <ShieldCheck className="w-5 h-5 text-brand-secondary group-hover:text-brand-text transition-colors" />
                  Panel Administración
                </Link>
              )}

              {(role === Rol.ADMINISTRADOR || role === Rol.CLIENTE) && (
                <Link
                  href={
                    role === Rol.ADMINISTRADOR && !profileComplete
                      ? "/completar-perfil"
                      : "/perfil"
                  }
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-brand-secondary hover:text-brand-text hover:bg-brand-bg transition-all group"
                  onClick={handleClose}
                >
                  <UserCircle className="w-5 h-5 text-brand-secondary group-hover:text-brand-text transition-colors" />
                  {role === Rol.ADMINISTRADOR && !profileComplete
                    ? "Completar perfil"
                    : "Ver perfil"}
                </Link>
              )}

              {role === Rol.CLIENTE && (
                <Link
                  href="/mensajeria"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-brand-secondary hover:text-brand-text hover:bg-brand-bg transition-all group"
                  onClick={handleClose}
                >
                  <MessageSquare className="w-5 h-5 text-brand-secondary group-hover:text-brand-text transition-colors" />
                  <span>Mensajería</span>
                  <MensajeriaBadge size="sm" />
                </Link>
              )}

              {role === Rol.CLIENTE && (
                <Link
                  href="/historial-compras"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-brand-secondary hover:text-brand-text hover:bg-brand-bg transition-all group"
                  onClick={handleClose}
                >
                  <Receipt className="w-5 h-5 text-brand-secondary group-hover:text-brand-text transition-colors" />
                  Historial de compras
                </Link>
              )}

              {role === Rol.ROOT && (
                <button
                  onClick={() => {
                    onOpenChangePwd();
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-brand-secondary hover:text-brand-text hover:bg-brand-bg transition-all text-left cursor-pointer group"
                >
                  <KeyRound className="w-5 h-5 text-brand-secondary group-hover:text-brand-text transition-colors" />
                  Cambiar contraseña
                </button>
              )}

              {/* Divider */}
              <div className="my-2 border-t border-brand-accent/10" />

              <button
                onClick={() => globalSignOutAction()}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-brand-primary hover:text-brand-primary hover:bg-brand-primary/10 transition-all text-left cursor-pointer group"
              >
                <LogOut className="w-5 h-5 text-brand-primary/90 group-hover:text-brand-primary transition-colors" />
                Cerrar sesión
              </button>
            </>
          )}
        </nav>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-t border-brand-accent/10">
          <Link
            href="/"
            className="text-xs text-brand-accent hover:text-brand-text transition-colors"
            onClick={handleClose}
          >
            Biblioteca de Alejandría
          </Link>
        </div>
      </div>
    </div>
  );
}
