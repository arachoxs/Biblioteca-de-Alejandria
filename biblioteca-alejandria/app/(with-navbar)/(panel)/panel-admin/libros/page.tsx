import LibrosContent from "./LibrosContent";

export const metadata = {
  title: "Gestión de Libros — Biblioteca de Alejandría",
  description: "Administra el catálogo bibliográfico de la biblioteca.",
};

export default function GestionLibrosPage() {
  return (
    <div className="flex-1 bg-brand-bg flex flex-col font-sans">
      <LibrosContent />
    </div>
  );
}
