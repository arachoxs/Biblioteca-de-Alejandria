import RootNavbar from "@/components/RootNavbar";
import ActionCard from "@/components/ActionCard";
import { ShieldCheck, Users, FileClock, Settings } from "lucide-react";

export const metadata = {
  title: "Panel Root — Biblioteca de Alejandría",
  description: "Panel de control maestro de la Biblioteca de Alejandría.",
};

export default function PanelRootPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <RootNavbar />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:px-10 lg:py-16">
        <div className="w-full max-w-4xl">

          {/* Page Header */}
          <header className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-primary rounded-xl mb-5 shadow-lg shadow-brand-primary/20">
              <ShieldCheck className="w-7 h-7 text-white" strokeWidth={1.8} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-brand-primary tracking-tight mb-3">
              Panel de Control
            </h1>
            <div className="w-12 h-0.5 bg-brand-accent mx-auto rounded-full" />
          </header>

          {/* Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <ActionCard
              href="/panel-root/administradores"
              title="Administradores"
              description="Gestiona credenciales y permisos del equipo."
              category="Personal"
              icon={Users}
              categoryIcon={ShieldCheck}
              delayClass="delay-100"
            />

            <ActionCard
              href="/panel-root/auditoria"
              title="Auditoría"
              description="Historial de acciones del sistema."
              category="Seguridad"
              icon={FileClock}
              delayClass="delay-150"
            />

            <ActionCard
              href="/panel-root/configuracion"
              title="Configuración"
              description="Variables y reglas del sistema."
              category="Sistema"
              icon={Settings}
              delayClass="delay-200"
            />
          </div>

        </div>
      </main>
    </div>
  );
}
