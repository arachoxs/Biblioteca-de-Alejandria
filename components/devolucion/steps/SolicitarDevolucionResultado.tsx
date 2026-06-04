"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";

interface PasoResultadoProps {
  tipo: "exito" | "error";
  errorMessage: string | null;
}

const ERROR_MESSAGES: Record<string, string> = {
  PLAZO_VENCIDO: "El plazo para solicitar la devolución ha vencido (8 días desde la entrega).",
  COMPRA_NO_ENTREGADA: "La compra aún no ha sido entregada.",
  ITEM_YA_DEVUELTO: "Uno de los productos ya fue devuelto previamente.",
};

export default function PasoResultado({ tipo, errorMessage }: PasoResultadoProps) {
  if (tipo === "exito") {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-success mb-4" />
        <h3 className="text-lg font-semibold text-brand-text mb-2">
          Solicitud registrada
        </h3>
        <p className="text-sm text-brand-secondary max-w-xs">
          Tu solicitud de devolución ha sido registrada. Revisa tu correo
          para ver el código QR y el enlace al detalle.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-brand-text mb-2">
        Error al solicitar
      </h3>
      <p className="text-sm text-brand-secondary max-w-xs">
        {errorMessage && ERROR_MESSAGES[errorMessage]
          ? ERROR_MESSAGES[errorMessage]
          : "Ocurrió un error al procesar tu solicitud. Intenta de nuevo."}
      </p>
    </div>
  );
}
