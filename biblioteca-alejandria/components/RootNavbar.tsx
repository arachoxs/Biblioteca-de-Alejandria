"use client";

import Link from "next/link";
import { User, LogOut, KeyRound, Crown, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
// Assuming we might have a logout action, or just front-end for now
import { redirect } from "next/navigation";

export default function RootNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    // Here would be the actual supabase logout logic in a real app
    // e.g. await fetch('/api/auth/logout', { method: 'POST' });
    redirect("/login");
  };

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 bg-brand-text border-b-4 border-brand-primary">
      {/* Brand */}
      <Link href="/panel-root" className="flex items-center gap-3 text-brand-bg hover:opacity-90 transition-opacity">
        <div className="w-9 h-9 border-2 border-brand-accent rounded-full flex items-center justify-center font-display font-bold text-lg text-brand-accent shrink-0">
          BA
        </div>
        <span className="font-display text-xl font-semibold tracking-wide hidden sm:block">
          Biblioteca de Alejandría
        </span>
      </Link>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        {/* User Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-brand-accent/15 rounded-full border border-brand-accent/20">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-primary ring-2 ring-brand-primary/30" />
          <span className="text-brand-accent text-xs font-medium tracking-wide">
            Usuario Root
          </span>
        </div>

        {/* Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-2 rounded-lg bg-brand-bg/5 hover:bg-brand-bg/10 border border-transparent hover:border-brand-accent/30 transition-all text-brand-accent"
            aria-label="Menú de usuario"
          >
            <User className="w-5 h-5" />
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Menu Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-brand-accent/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 bg-brand-bg/50 border-b border-brand-accent/10">
                <p className="text-sm font-semibold text-brand-text">root@baja.com</p>
                <p className="text-xs text-brand-secondary">Root</p>
              </div>
              <div className="p-2 flex flex-col gap-1">
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-brand-secondary hover:text-brand-text hover:bg-brand-accent/10 rounded-md transition-colors text-left"
                  onClick={() => alert("Abrir modal de cambiar contraseña")}
                >
                  <KeyRound className="w-4 h-4 text-brand-accent" />
                  Cambiar contraseña
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-brand-primary hover:bg-brand-primary/10 rounded-md transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
