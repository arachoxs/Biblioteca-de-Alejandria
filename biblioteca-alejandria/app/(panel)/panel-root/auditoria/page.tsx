import Navbar from "@/components/Navbar";
import AuditoriaContent from "./AuditoriaContent";

export const metadata = {
  title: "Auditoría — Biblioteca de Alejandría",
  description: "Historial de acciones administrativas del sistema.",
};

export default function AuditoriaPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans">
      <Navbar />
      <AuditoriaContent />
    </div>
  );
}
