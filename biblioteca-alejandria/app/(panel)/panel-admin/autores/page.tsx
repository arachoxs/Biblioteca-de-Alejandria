import Navbar from "@/components/Navbar";
import AutoresContent from "./AutoresContent";

export const metadata = {
  title: "Gestión de Autores — Biblioteca de Alejandría",
  description: "Administra el catálogo de autores de la biblioteca.",
};

export default function GestionAutoresPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans">
      <Navbar />
      <AutoresContent />
    </div>
  );
}
