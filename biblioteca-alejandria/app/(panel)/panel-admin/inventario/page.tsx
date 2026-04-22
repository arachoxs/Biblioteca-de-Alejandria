import Navbar from "@/components/Navbar";
import InventarioContent from "./InventarioContent";

export const metadata = {
  title: "Inventario — Biblioteca de Alejandría",
  description: "Gestiona el inventario de libros por tienda.",
};

export default function GestionInventarioPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans">
      <Navbar />
      <InventarioContent />
    </div>
  );
}
