import { MAX_RESERVAS_DIFERENTES, MAX_RESERVAS_MISMO_LIBRO } from "@/lib/types/reserva";
import type { ReservaActionResponse } from "@/lib/types/reserva";

// ─── Mensajes de error ─────────────────────────────────────────────

export function buildCopyNotFoundResponse(): ReservaActionResponse {
  return {
    success: false,
    errors: { id_copia: "La copia indicada no existe o fue eliminada." },
    message: "No se encontró la copia especificada.",
  };
}

export function buildCopyNotAvailableResponse(): ReservaActionResponse {
  return {
    success: false,
    errors: { id_copia: "La copia no está disponible para reserva." },
    message: "La copia no se encuentra disponible en este momento.",
  };
}

export function buildCopyAlreadyReservedResponse(): ReservaActionResponse {
  return {
    success: false,
    errors: { id_copia: "Esta copia ya está reservada por otro usuario." },
    message: "La copia ya se encuentra reservada.",
  };
}

export function buildExceedsMaxDifferentBooksResponse(
  currentCount: number,
): ReservaActionResponse {
  return {
    success: false,
    errors: {
      form: `Solo puedes tener hasta ${MAX_RESERVAS_DIFERENTES} libros reservados simultáneamente. Actualmente tienes ${currentCount}.`,
    },
    message: `Has alcanzado el límite de ${MAX_RESERVAS_DIFERENTES} libros reservados.`,
  };
}

export function buildExceedsMaxSameBookResponse(
  currentCount: number,
  titulo: string,
): ReservaActionResponse {
  return {
    success: false,
    errors: {
      form: `Solo puedes reservar hasta ${MAX_RESERVAS_MISMO_LIBRO} copias del mismo libro. Ya tienes ${currentCount} copias reservadas de "${titulo}".`,
    },
    message: `Has alcanzado el límite de ${MAX_RESERVAS_MISMO_LIBRO} copias del mismo libro.`,
  };
}

export function buildReservaNotFoundResponse(): ReservaActionResponse {
  return {
    success: false,
    errors: { id: "La reserva indicada no existe." },
    message: "No se encontró la reserva.",
  };
}

export function buildReservaNotOwnedResponse(): ReservaActionResponse {
  return {
    success: false,
    errors: { id: "Esta reserva no te pertenece." },
    message: "No puedes cancelar una reserva que no te pertenece.",
  };
}

export function buildSessionRequiredResponse(): ReservaActionResponse {
  return {
    success: false,
    errors: { form: "Debes iniciar sesión para realizar esta acción." },
    message: "No hay sesión activa.",
  };
}

// ─── Mensajes de éxito ─────────────────────────────────────────────

export function buildReservaSuccessResponse(): ReservaActionResponse {
  return {
    success: true,
    message: "Libro reservado exitosamente.",
  };
}

export function buildCancelSuccessResponse(): ReservaActionResponse {
  return {
    success: true,
    message: "Reserva cancelada exitosamente.",
  };
}

export function buildCleanupResponse(cleanedCount: number): ReservaActionResponse {
  return {
    success: true,
    message:
      cleanedCount === 1
        ? "1 reserva expirada liberada."
        : `${cleanedCount} reservas expiradas liberadas.`,
  };
}
