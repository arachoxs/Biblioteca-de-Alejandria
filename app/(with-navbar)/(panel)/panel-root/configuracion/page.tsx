import ConfiguracionContent from "./ConfiguracionContent";

export const metadata = {
  title: "Configuración — Panel Root",
  description: "Variables y reglas del sistema.",
};

export default function ConfiguracionPage() {
  return (
    <div className="flex-1 bg-brand-bg flex flex-col font-sans">
      <ConfiguracionContent />
    </div>
  );
}
