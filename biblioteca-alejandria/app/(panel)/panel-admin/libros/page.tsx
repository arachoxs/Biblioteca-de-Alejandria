import Navbar from "@/components/Navbar";
import LibrosContent from "./LibrosContent";

export const metadata = {
  title: "Gestión de Libros — Biblioteca de Alejandría",
  description: "Administra el catálogo bibliográfico de la biblioteca.",
};

export default function GestionLibrosPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans">
      <Navbar />
      <LibrosContent />
    </div>
  );
}
