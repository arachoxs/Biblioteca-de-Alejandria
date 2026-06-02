import { fetchHistorialComprasAction } from "./actions";
import HistorialComprasClient from "@/components/compra/HistorialComprasClient";

export const metadata = {
  title: "Historial de Compras — Biblioteca de Alejandría",
  description:
    "Consulta el historial de tus compras realizadas en la Biblioteca de Alejandría.",
};

export default async function HistorialComprasPage() {
  const initialData = await fetchHistorialComprasAction({
    page: 1,
    pageSize: 5,
  });

  return (
    <div className="flex-1 bg-brand-bg flex flex-col">
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <h1 className="text-2xl font-semibold text-brand-text mb-6">
          Historial de Compras
        </h1>
        <HistorialComprasClient initialData={initialData} />
      </main>
    </div>
  );
}
