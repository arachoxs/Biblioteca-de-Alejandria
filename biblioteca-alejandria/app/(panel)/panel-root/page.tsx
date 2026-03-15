import RootNavbar from "@/components/RootNavbar";
import ActionCard from "@/components/ActionCard";
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

          {/* Cards */}
          <ActionCard
            href="/panel-root#gestionar-admins"
            title="Gestionar Administradores"
            description="Crea nuevos administradores y gestiona los existentes."
            category="Personal"
            icon={Users}
            categoryIcon={ShieldCheck}
            delayClass="delay-150"
          />

          <ActionCard
            href="/panel-root#auditoria"
            title="Registro de Auditoría"
            description="Revisa el historial de acciones realizadas en el panel administrativo."
            category="Seguridad"
            icon={FileClock}
            delayClass="delay-200"
          />

          <ActionCard
            href="/panel-root#configuracion"
            title="Configuración Global"
            description="Gestiona variables de entorno, reglas globales de acceso y mantenimiento del sistema."
            category="Sistema"
            icon={Settings}
            delayClass="delay-300"
          />
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
