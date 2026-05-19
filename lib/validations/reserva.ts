import { isValidUUID, sanitizeText } from "@/lib/validations/rules";
import type { ReservaActionResponse } from "@/lib/types/reserva";

export function sanitizeCopiaId({
  copiaId,
}: {
  copiaId: string;
}): string | null {
  const cleanId = sanitizeText(copiaId);
  if (!cleanId || !isValidUUID(cleanId)) return null;
  return cleanId;
}

export function sanitizeReservaId({ id }: { id: string }): string | null {
  const cleanId = sanitizeText(id);
  if (!cleanId || !isValidUUID(cleanId)) return null;
  return cleanId;
}

export function getCopiaIdValidationError({
  copiaId,
}: {
  copiaId: string;
}): ReservaActionResponse | null {
  if (isValidUUID(sanitizeText(copiaId))) return null;
  return {
    success: false,
    errors: { id_copia: "El ID de la copia no es válido." },
    message: "No se pudo realizar la reserva.",
  };
}

export function getReservaIdValidationError({
  id,
}: {
  id: string;
}): ReservaActionResponse | null {
  if (isValidUUID(sanitizeText(id))) return null;
  return {
    success: false,
    errors: { id: "El ID de la reserva no es válido." },
    message: "No se pudo procesar la solicitud.",
  };
}
