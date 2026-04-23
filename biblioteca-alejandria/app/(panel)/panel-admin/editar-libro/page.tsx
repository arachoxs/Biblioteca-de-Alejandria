import Navbar from "@/components/Navbar";
import EditarLibroContent from "./EditarLibroContent";

export const metadata = {
  title: "Editar Libro — Biblioteca de Alejandría",
  description: "Edita la información bibliográfica de un libro.",
};

import { Suspense } from "react";

export default function EditarLibroPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans">
      <Navbar />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center">Cargando editor...</div>}>
        <EditarLibroContent />
      </Suspense>
    </div>
  );
}
