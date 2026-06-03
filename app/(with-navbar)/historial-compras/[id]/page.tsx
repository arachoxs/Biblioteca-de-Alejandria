import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchCompraDetalleAction } from "../actions";
import CompraDetalleClient from "@/components/compra/CompraDetalleClient";

interface CompraDetallePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: CompraDetallePageProps): Promise<Metadata> {
  const { id } = await params;
  const compra = await fetchCompraDetalleAction(id);

  return {
    title: compra
      ? `Compra ${compra.id.slice(0, 8)} — Biblioteca de Alejandría`
      : "Compra no encontrada",
    description: compra
      ? `Detalle de compra realizada el ${new Date(compra.fecha).toLocaleDateString("es-VE")}`
      : "Detalle de compra",
  };
}

export default async function CompraDetallePage({
  params,
}: CompraDetallePageProps) {
  const { id } = await params;
  const compra = await fetchCompraDetalleAction(id);

  if (!compra) {
    notFound();
  }

  return (
    <div className="flex-1 bg-brand-bg flex flex-col">
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <CompraDetalleClient initialData={compra} />
      </main>
    </div>
  );
}
