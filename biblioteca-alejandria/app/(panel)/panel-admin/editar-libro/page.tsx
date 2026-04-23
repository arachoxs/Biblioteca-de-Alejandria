import Navbar from "@/components/Navbar";
import EditarLibroContent from "./EditarLibroContent";

export const metadata = {
  title: "Editar Libro — Biblioteca de Alejandría",
  description: "Edita la información bibliográfica de un libro.",
};

export default function EditarLibroPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans">
      <Navbar />
      <EditarLibroContent />
    </div>
  );
}
