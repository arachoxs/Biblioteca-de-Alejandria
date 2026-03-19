import Navbar from "@/components/Navbar";
import AdministradoresContent from "./AdministradoresContent";

export default function GestionAdministradoresPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans">
      <Navbar /> {/* Navbar específico para panel-root, si es necesario */}
      <AdministradoresContent />
    </div>
  );
}
