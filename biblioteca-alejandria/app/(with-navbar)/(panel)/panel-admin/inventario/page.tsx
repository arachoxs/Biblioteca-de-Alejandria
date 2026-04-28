import InventarioContent from "./InventarioContent";

export const metadata = {
  title: "Inventario — Biblioteca de Alejandría",
  description: "Gestiona el inventario de libros por tienda.",
};

export default function GestionInventarioPage() {
  return (
    <div className="flex-1 bg-brand-bg flex flex-col font-sans">
      <InventarioContent />
    </div>
  );
}
