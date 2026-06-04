import { fetchDevolucionPorTokenAction } from "./actions";
import DevolucionDetalleClient from "@/components/devolucion/DevolucionDetalleClient";
import { redirect } from "next/navigation";

interface DevolucionPageProps {
  params: Promise<{ token: string }>;
}

export default async function DevolucionPage({ params }: DevolucionPageProps) {
  const { token } = await params;

  const devolucion = await fetchDevolucionPorTokenAction(token);

  if (!devolucion) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <DevolucionDetalleClient devolucion={devolucion} />
      </div>
    </main>
  );
}
