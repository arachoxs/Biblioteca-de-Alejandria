import AutoresContent from "./AutoresContent";

export const metadata = {
  title: "Gestión de Autores — Biblioteca de Alejandría",
  description: "Administra el catálogo de autores de la biblioteca.",
};

export default function GestionAutoresPage() {
  return (
    <div className="flex-1 bg-brand-bg flex flex-col font-sans">
      <AutoresContent />
    </div>
  );
}
