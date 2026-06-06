import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getActiveLibroById } from "@/models/libroModel";
import { getModeloRAByLibroId } from "@/models/modeloRAModel";
import type { ModeloRADimensiones, ModeloRATexturasLibro } from "@/lib/types/modelo_ra";
import ARPageContent from "./ARPageContent";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const libro = await getActiveLibroById(id);
  return {
    title: libro ? `Ver "${libro.titulo}" en AR` : "Visor AR",
  };
}

export default async function BookARPage({ params }: PageProps) {
  const { id } = await params;

  const libro = await getActiveLibroById(id);
  if (!libro) notFound();

  let modeloRA = null;
  if (libro.id_modeloRA) {
    modeloRA = await getModeloRAByLibroId(id);
  }

  const dimensiones = modeloRA?.dimensiones
    ? (modeloRA.dimensiones as unknown as ModeloRADimensiones)
    : { ancho: 17, alto: 24, profundidad: Math.max(libro.paginas * 0.007, 0.1) };

  const texturas = modeloRA?.texturas
    ? (modeloRA.texturas as unknown as ModeloRATexturasLibro)
    : { portada: null, contraportada: null, lomo: null };

  return (
    <main className="fixed inset-0 z-50 bg-black" style={{ height: "100dvh" }}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }>
        <ARPageContent
          titulo={libro.titulo}
          sinopsis={libro.sipnosis || ""}
          dimensiones={dimensiones}
          texturas={texturas}
        />
      </Suspense>
    </main>
  );
}
