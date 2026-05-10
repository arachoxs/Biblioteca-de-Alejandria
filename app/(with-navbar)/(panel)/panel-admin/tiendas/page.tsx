import TiendasContent from "./TiendasContent";

export const metadata = {
  title: "Tiendas — Biblioteca de Alejandría",
  description:
    "Gestiona las tiendas físicas, sus horarios y dirección asociada.",
};

export default function GestionTiendasPage() {
  return (
    <div className="flex-1 bg-brand-bg flex flex-col font-sans">
      <TiendasContent />
    </div>
  );
}
