import Navbar from "@/components/Navbar";
import ActionCard from "@/components/ActionCard";
import {
  Library,
  UsersRound,
  BookOpen,
  Store,
  Boxes,
  Newspaper,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "Panel de Administrador — Biblioteca de Alejandría",
  description: "Panel de control para administradores de la Biblioteca.",
};

export default function PanelAdminPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:px-10 lg:py-16">
        <div className="w-full max-w-5xl">

          {/* Page Header — mirrors panel-root */}
          <header className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-primary rounded-xl mb-5 shadow-lg shadow-brand-primary/20">
              <ShieldCheck className="w-7 h-7 text-white" strokeWidth={1.8} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-brand-primary tracking-tight mb-3 font-display">
              Panel de Administración
            </h1>
            <div className="w-12 h-0.5 bg-brand-accent mx-auto rounded-full" />
          </header>

          {/* Section label */}
          <div className="flex items-center gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 ease-out fill-mode-both">
            <span className="text-[11px] uppercase tracking-[0.15em] text-brand-accent font-medium whitespace-nowrap">
              Módulos de gestión
            </span>
            <div className="flex-1 h-px bg-brand-accent/30" />
          </div>

          {/* Row 1 — 4 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
            <ActionCard
              href="/panel-admin/categorias"
              title="Categorías"
              description="Crea y edita las categorías literarias del catálogo."
              category="Catálogo"
              icon={Library}
              delayClass="delay-100"
            />
            <ActionCard
              href="/panel-admin/autores"
              title="Autores"
              description="Administra el registro de autores y su bibliografía."
              category="Catálogo"
              icon={UsersRound}
              delayClass="delay-150"
            />
            <ActionCard
              href="/panel-admin/libros"
              title="Bibliografía"
              description="Gestiona los libros, precios y disponibilidad del catálogo."
              category="Catálogo"
              icon={BookOpen}
              delayClass="delay-200"
            />
            <ActionCard
              href="/panel-admin/tiendas"
              title="Tiendas"
              description="Administra las sucursales, horarios y datos de contacto."
              category="Operaciones"
              icon={Store}
              delayClass="delay-300"
            />
          </div>

          {/* Row 2 — 3 cards, centered */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 lg:w-3/4 mx-auto">
            <ActionCard
              href="/panel-admin/inventario"
              title="Inventario"
              description="Controla el stock de libros por tienda y sucursal."
              category="Operaciones"
              icon={Boxes}
              delayClass="delay-[400ms]"
            />
            <ActionCard
              href="/panel-admin/noticias"
              title="Noticias"
              description="Gestiona las novedades vinculadas al catálogo."
              category="Contenido"
              icon={Newspaper}
              delayClass="delay-[500ms]"
            />
            <ActionCard
              href="/panel-admin/mensajeria"
              title="Mensajería"
              description="Comunícate en tiempo real con clientes y administradores."
              category="Comunicación"
              icon={MessageSquare}
              delayClass="delay-[600ms]"
            />
          </div>

        </div>
      </main>
    </div>
  );
}
