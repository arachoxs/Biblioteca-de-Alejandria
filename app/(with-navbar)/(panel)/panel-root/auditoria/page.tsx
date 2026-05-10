import AuditoriaContent from "./AuditoriaContent";

export const metadata = {
  title: "Auditoría — Biblioteca de Alejandría",
  description: "Historial de acciones administrativas del sistema.",
};

export default function AuditoriaPage() {
  return (
    <div className="flex-1 bg-brand-bg flex flex-col font-sans">
      <AuditoriaContent />
    </div>
  );
}
