import RegistrarLibroContent from "./RegistrarLibroContent";

export const metadata = {
  title: "Registrar Libro — Biblioteca de Alejandría",
  description: "Registra un nuevo libro en el catálogo bibliográfico.",
};

export default function RegistrarLibroPage() {
  return (
    <div className="flex-1 bg-brand-bg flex flex-col font-sans">
      <RegistrarLibroContent />
    </div>
  );
}
