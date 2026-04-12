import Navbar from "@/components/Navbar";
import CategoriasContent from "./CategoriasContent";

export const metadata = {
  title: "Categorías — Biblioteca de Alejandría",
  description: "Gestiona las categorías literarias del catálogo.",
};

export default function GestionCategoriasPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans">
      <Navbar />
      <CategoriasContent />
    </div>
  );
}
