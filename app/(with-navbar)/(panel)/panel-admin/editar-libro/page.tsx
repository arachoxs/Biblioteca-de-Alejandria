import EditarLibroContent from "./EditarLibroContent";
import { Suspense } from "react";

export const metadata = {
  title: "Editar Libro — Biblioteca de Alejandría",
  description: "Edita la información bibliográfica de un libro.",
};
export default function EditarLibroPage() {
  return (
    <div className="flex-1 bg-brand-bg flex flex-col font-sans">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            Cargando editor...
          </div>
        }>
        <EditarLibroContent />
      </Suspense>
    </div>
  );
}
