import CategoriasContent from "./CategoriasContent";

export const metadata = {
  title: "Categorías — Biblioteca de Alejandría",
  description: "Gestiona las categorías literarias del catálogo.",
};

export default function GestionCategoriasPage() {
  return (
    <div className="flex flex-col flex-1 bg-brand-bg  font-sans">
      <CategoriasContent />
    </div>
  );
}
