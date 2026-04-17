import Navbar from "@/components/Navbar";
import TiendasContent from "./TiendasContent";

export const metadata = {
  title: "Tiendas — Biblioteca de Alejandría",
  description: "Gestiona las tiendas físicas, sus horarios y dirección asociada.",
};

export default function GestionTiendasPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans">
      <Navbar />
      <TiendasContent />
    </div>
  );
}
