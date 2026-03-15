import RootNavbar from "@/components/RootNavbar";
import { ShieldCheck, Users, FileClock, Settings, Activity, Clock, Database } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Panel Root — Biblioteca de Alejandría",
  description: "Panel de control maestro de la Biblioteca de Alejandría.",
};

export default function PanelRootPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans">
      <RootNavbar />

      {/* Textura de fondo sutil mediante pseudo-elemento en CSS global, o podemos usar el background lineal aquí */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMTBoNDBWMHgtNDB6IiBmaWxsPSJyZ2JhKDk0LCA4MCwgNjMsIDAuMDMpIi8+CjxwYXRoIGQ9Ik0xMCAwaDMwdjQwSDEweiIgZmlsbD0icmdiYSg5NCwgODAsIDYzLCAwLjAzKSIvPgo8L3N2Zz4=')] mix-blend-multiply" />

      <main className="flex-1 px-6 py-12 md:px-10 lg:py-16 relative z-10 max-w-6xl w-full mx-auto">

        {/* Page Header */}
        <header className="mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-11 h-11 bg-brand-primary rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-brand-primary/20">
              <ShieldCheck className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-brand-primary tracking-tight">
              Panel de Control Root
            </h1>
          </div>
          <p className="text-brand-secondary text-sm md:text-base max-w-2xl pl-[3.75rem] leading-relaxed">
            Desde aquí puedes administrar credenciales de nivel administrativo, revisar registros de auditoría y modificar configuraciones globales.
          </p>
        </header>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 ease-out fill-mode-both">
          <span className="text-xs uppercase tracking-[0.15em] text-brand-accent font-semibold whitespace-nowrap">
            Acciones Principales
          </span>
          <div className="flex-1 h-px bg-brand-accent/30" />
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">

          {/* Card 1 */}
          <Link
            href="/panel-root#gestionar-admins" // Usar hash para demo, o crear sub-rutas después
            className="group relative bg-white border border-brand-accent/20 rounded-xl p-8 flex flex-col gap-5 text-brand-text hover:border-brand-accent/40 shadow-sm hover:shadow-xl hover:shadow-brand-text/5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 delay-150 fill-mode-both overflow-hidden hover:-translate-y-1"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />

            <div className="w-12 h-12 border-2 border-brand-accent/30 rounded-lg flex items-center justify-center bg-brand-bg/80 shrink-0 group-hover:bg-brand-primary/5 transition-colors">
              <Users className="w-5 h-5 text-brand-primary" strokeWidth={1.5} />
            </div>

            <div className="flex-1">
              <h2 className="font-display text-xl font-bold text-brand-text tracking-wide mb-2">
                Gestionar Administradores
              </h2>
              <p className="text-sm text-brand-secondary leading-relaxed">
                Crea nuevos administradores y gestiona los existentes.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-brand-accent/15 mt-auto">
              <span className="text-xs uppercase tracking-widest text-brand-accent font-medium">
                Personal
              </span>
              <div className="w-7 h-7 rounded-full border border-brand-accent/30 flex items-center justify-center group-hover:bg-brand-primary group-hover:border-brand-primary transition-colors">
                <ShieldCheck className="w-3 h-3 text-brand-primary group-hover:text-white transition-colors" />
              </div>
            </div>
          </Link>

          {/* Card 2 */}
          <Link
            href="/panel-root#auditoria"
            className="group text-left relative bg-white border border-brand-accent/20 rounded-xl p-8 flex flex-col gap-5 text-brand-text hover:border-brand-accent/40 shadow-sm hover:shadow-xl hover:shadow-brand-text/5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 delay-200 fill-mode-both overflow-hidden hover:-translate-y-1"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />

            <div className="w-12 h-12 border-2 border-brand-accent/30 rounded-lg flex items-center justify-center bg-brand-bg/80 shrink-0 group-hover:bg-brand-primary/5 transition-colors">
              <FileClock className="w-5 h-5 text-brand-primary" strokeWidth={1.5} />
            </div>

            <div className="flex-1">
              <h2 className="font-display text-xl font-bold text-brand-text tracking-wide mb-2">
                Registro de Auditoría
              </h2>
              <p className="text-sm text-brand-secondary leading-relaxed">
                Revisa el historial de acciones realizadas en el panel administrativo.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-brand-accent/15 mt-auto">
              <span className="text-xs uppercase tracking-widest text-brand-accent font-medium">
                Seguridad
              </span>
              <div className="w-7 h-7 rounded-full border border-brand-accent/30 flex items-center justify-center group-hover:bg-brand-primary group-hover:border-brand-primary transition-colors">
                <FileClock className="w-3 h-3 text-brand-primary group-hover:text-white transition-colors" />
              </div>
            </div>
          </Link>

          {/* Card 3 (Placeholder for structural balance as per mockup styles) */}
          <Link
            href="/panel-root#configuracion"
            className="group relative bg-white border border-brand-accent/20 rounded-xl p-8 flex flex-col gap-5 text-brand-text hover:border-brand-accent/40 shadow-sm hover:shadow-xl hover:shadow-brand-text/5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 delay-300 fill-mode-both overflow-hidden hover:-translate-y-1"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />

            <div className="w-12 h-12 border-2 border-brand-accent/30 rounded-lg flex items-center justify-center bg-brand-bg/80 shrink-0 group-hover:bg-brand-primary/5 transition-colors">
              <Settings className="w-5 h-5 text-brand-primary" strokeWidth={1.5} />
            </div>

            <div className="flex-1">
              <h2 className="font-display text-xl font-bold text-brand-text tracking-wide mb-2">
                Configuración Global
              </h2>
              <p className="text-sm text-brand-secondary leading-relaxed">
                Gestiona variables de entorno, reglas globales de acceso y mantenimiento del sistema.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-brand-accent/15 mt-auto">
              <span className="text-xs uppercase tracking-widest text-brand-accent font-medium">
                Sistema
              </span>
              <div className="w-7 h-7 rounded-full border border-brand-accent/30 flex items-center justify-center group-hover:bg-brand-primary group-hover:border-brand-primary transition-colors">
                <Settings className="w-3 h-3 text-brand-primary group-hover:text-white transition-colors" />
              </div>
            </div>
          </Link>
        </div>

        {/* Info Strip */}
        <div className="bg-brand-text rounded-xl p-6 md:px-8 md:py-6 flex flex-wrap items-center gap-6 md:gap-14 shadow-2xl shadow-brand-text/10 animate-in fade-in slide-in-from-bottom-8 delay-500 fill-mode-both">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-brand-accent" strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-brand-secondary font-semibold">Estado de Sistema</span>
              <span className="text-brand-bg text-sm font-medium flex items-center gap-2 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                Operativo
              </span>
            </div>
          </div>

          <div className="hidden md:block w-px h-8 bg-brand-accent/20" />

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-brand-accent" strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-brand-secondary font-semibold">Uptime</span>
              <span className="text-brand-bg text-sm font-medium mt-0.5">99.9% (Últimos 30 días)</span>
            </div>
          </div>

          <div className="hidden lg:block w-px h-8 bg-brand-accent/20" />

          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-brand-accent" strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-brand-secondary font-semibold">Último Respaldo DB</span>
              <span className="text-brand-bg text-sm font-medium mt-0.5">Hace 2 horas</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
