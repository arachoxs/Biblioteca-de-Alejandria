import "server-only";

import { getErrorMessage } from "@/lib/services/errors";
import { getCurrentUser } from "@/models/authModel";
import {
  getCopiaById,
  getCopiaIdsByLibro,
  updateCopiaEstadoIf,
} from "@/models/copiaModel";
import { getActiveLibroById } from "@/models/libroModel";
import { requireClientRole } from "@/lib/validations/server-auth";
import {
  createReserva as modelsCreateReserva,
  deleteReserva,
  deleteReservasBatch,
  getActiveReservasConLibro,
  getReservaById,
  getReservasByUserPaginated,
  countReservasActivasByUser,
  countReservasByUserAndCopias,
  getReservasExpiradas,
} from "@/models/reservaModel";
import { MAX_RESERVAS_DIFERENTES, MAX_RESERVAS_MISMO_LIBRO } from "@/lib/types/reserva";
import type {
  ReservaActionResponse,
  ReservaAgrupadaItem,
  ReservaListResponse,
  ReservasAgrupadasResponse,
} from "@/lib/types/reserva";
import * as rules from "@/services/rules/reservaRules";

// ─── Operaciones de cliente ────────────────────────────────────────

/**
 * Crea una reserva para el usuario actual.
 *
 * Flujo:
 * 1. Valida rol CLIENTE y sesión activa
 * 2. Verifica que la copia exista y esté "disponible"
 * 3. Limpia reservas expiradas para liberar slots
 * 4. Reclama la copia atómicamente (disponible → reservado)
 * 5. Valida límites (5 libros diferentes, 3 copias mismo libro)
 * 6. Crea la reserva en BD
 * 7. Rollback parcial si falla la creación
 */
export async function createReserva(
  id_copia: string,
): Promise<ReservaActionResponse> {
  const roleCheck = await requireClientRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const user = await getCurrentUser();
    if (!user) return rules.buildSessionRequiredResponse();

    const copia = await getCopiaById(id_copia);
    if (!copia) return rules.buildCopyNotFoundResponse();
    if (copia.estado !== "disponible") {
      return rules.buildCopyNotAvailableResponse();
    }

    const libro = await getActiveLibroById(copia.id_libro);

    await cleanExpiredReservasInternal();

    const claimed = await updateCopiaEstadoIf(
      id_copia,
      "disponible",
      "reservado",
    );
    if (!claimed) return rules.buildCopyNotAvailableResponse();

    const activeCount = await countReservasActivasByUser(user.id);
    if (activeCount >= MAX_RESERVAS_DIFERENTES) {
      await safeRollback(id_copia);
      return rules.buildExceedsMaxDifferentBooksResponse(activeCount);
    }

    if (libro) {
      const copiaIds = await getCopiaIdsByLibro(libro.id);
      const sameBookCount = await countReservasByUserAndCopias(
        user.id,
        copiaIds,
      );
      if (sameBookCount >= MAX_RESERVAS_MISMO_LIBRO) {
        await safeRollback(id_copia);
        return rules.buildExceedsMaxSameBookResponse(
          sameBookCount,
          libro.titulo,
        );
      }
    }

    try {
      await modelsCreateReserva({ id_copia, id_usuario: user.id });
    } catch (error) {
      await safeRollback(id_copia);
      return {
        success: false,
        errors: { form: getErrorMessage(error) },
        message: "No se pudo crear la reserva.",
      };
    }

    return rules.buildReservaSuccessResponse();
  } catch (error) {
    console.error("[reservaService] Error inesperado al reservar copia:", error);
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "Ocurrió un error inesperado al realizar la reserva.",
    };
  }
}

/**
 * Cancela una reserva del usuario actual.
 *
 * Primero libera la copia (disponible), luego elimina la reserva.
 */
export async function cancelReserva(
  reservaId: string,
): Promise<ReservaActionResponse> {
  const roleCheck = await requireClientRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const user = await getCurrentUser();
    if (!user) return rules.buildSessionRequiredResponse();

    const modelReserva = await getReservaById(reservaId);
    if (!modelReserva) return rules.buildReservaNotFoundResponse();
    if (modelReserva.id_usuario !== user.id) return rules.buildReservaNotOwnedResponse();

    const copiaLiberada = await updateCopiaEstadoIf(
      modelReserva.id_copia,
      "reservado",
      "disponible",
    );
    if (!copiaLiberada) {
      console.error(
        "[reservaService] La copia no estaba en estado reservado:",
        modelReserva.id_copia,
      );
    }

    await deleteReserva(reservaId);

    return rules.buildCancelSuccessResponse();
  } catch (error) {
    console.error(
      "[reservaService] Error inesperado al cancelar reserva:",
      error,
    );
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "Ocurrió un error inesperado al cancelar la reserva.",
    };
  }
}

/**
 * Obtiene las reservas activas del usuario actual paginadas.
 */
export async function getMyReservas(
  page: number = 1,
  pageSize: number = 10,
): Promise<ReservaListResponse> {
  const roleCheck = await requireClientRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        ...rules.buildSessionRequiredResponse(),
        data: { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 },
      };
    }

    const result = await getReservasByUserPaginated(user.id, page, pageSize);

    return { success: true, data: result };
  } catch (error) {
    console.error(
      "[reservaService] Error inesperado al obtener reservas:",
      error,
    );
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "Ocurrió un error al obtener las reservas.",
    };
  }
}

/**
 * Obtiene el resumen de reservas del usuario actual agrupado por libro.
 *
 * Cada entrada representa un libro con el total de copias reservadas
 * y la fecha de expiración más próxima. Ideal para la vista de carrito.
 */
export async function getReservasSummary(): Promise<ReservasAgrupadasResponse> {
  const roleCheck = await requireClientRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return { ...rules.buildSessionRequiredResponse(), data: [] };
    }

    const reservas = await getActiveReservasConLibro(user.id);

    const grouped = new Map<string, ReservaAgrupadaItem>();

    for (const r of reservas) {
      const libro = r.copia?.libro;
      if (!libro) continue;

      const key = libro.id;
      const existing = grouped.get(key);

      if (existing) {
        existing.copias_reservadas++;
        if (r.fecha_expiracion < existing.fecha_expiracion_mas_cercana) {
          existing.fecha_expiracion_mas_cercana = r.fecha_expiracion;
        }
        existing.reservas.push({
          id_reserva: r.id,
          id_copia: r.id_copia,
          fecha_expiracion: r.fecha_expiracion,
        });
      } else {
        grouped.set(key, {
          id_libro: key,
          titulo: libro.titulo,
          isbn: libro.isbn,
          precio: libro.precio,
          autor_nombre: libro.autor?.nombre ?? null,
          copias_reservadas: 1,
          fecha_expiracion_mas_cercana: r.fecha_expiracion,
          reservas: [
            {
              id_reserva: r.id,
              id_copia: r.id_copia,
              fecha_expiracion: r.fecha_expiracion,
            },
          ],
        });
      }
    }

    return {
      success: true,
      data: Array.from(grouped.values()),
    };
  } catch (error) {
    console.error(
      "[reservaService] Error inesperado al obtener resumen de reservas:",
      error,
    );
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "Ocurrió un error al obtener el resumen de reservas.",
      data: [],
    };
  }
}

// ─── Mantenimiento ──────────────────────────────────────────────────

/**
 * Limpia todas las reservas expiradas.
 * Libera las copias y elimina las reservas vencidas.
 * Útil para llamar desde cron o antes de crear una nueva reserva.
 */
export async function cleanExpiredReservas(): Promise<ReservaActionResponse> {
  const expiradas = await getReservasExpiradas();
  if (expiradas.length === 0) return rules.buildCleanupResponse(0);

  for (const reserva of expiradas) {
    try {
      await updateCopiaEstadoIf(reserva.id_copia, "reservado", "disponible");
    } catch (error) {
      console.error(
        "[reservaService] Error al liberar copia expirada:",
        reserva.id_copia,
        error,
      );
    }
  }

  const ids = expiradas.map((r) => r.id);
  await deleteReservasBatch(ids);

  return rules.buildCleanupResponse(expiradas.length);
}

// ─── Internos ───────────────────────────────────────────────────────

/**
 * Limpieza interna de expiradas, sin retorno.
 * Se llama antes de crear una reserva para liberar slots.
 */
async function cleanExpiredReservasInternal(): Promise<void> {
  await cleanExpiredReservas();
}

/**
 * Rollback seguro: intenta devolver la copia a "disponible".
 * Si falla, solo loguea el error para no interrumpir el flujo.
 */
async function safeRollback(id_copia: string): Promise<void> {
  try {
    await updateCopiaEstadoIf(id_copia, "reservado", "disponible");
  } catch (error) {
    console.error(
      "[reservaService] Error en rollback de copia:",
      id_copia,
      error,
    );
  }
}
