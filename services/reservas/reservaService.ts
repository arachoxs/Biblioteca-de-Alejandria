import "server-only";

import { getErrorMessage } from "@/lib/services/errors";
import { getCurrentUser } from "@/models/authModel";
import {
  getCopiaById,
  getCopiaIdsByLibro,
  getAvailableCopiaIdsByLibro,
  updateCopiaEstadoIf,
  updateCopiaEstadoIfBatch,
} from "@/models/copiaModel";
import { getActiveLibroById } from "@/models/libroModel";
import { requireClientRole } from "@/lib/validations/server-auth";
import {
  createReserva as modelsCreateReserva,
  createReservasBatch,
  deleteReserva,
  deleteReservasBatch,
  getActiveReservasConLibro,
  getReservaById,
  countReservasActivasByUser,
  countReservasByUserAndCopias,
  getReservasExpiradas,
} from "@/models/reservaModel";
import { MAX_RESERVAS_DIFERENTES, MAX_RESERVAS_MISMO_LIBRO } from "@/lib/types/reserva";
import type {
  ReservaActionResponse,
  ReservaAgrupadaItem,
  ReservasAgrupadasResponse,
  RemainingSlotsResponse,
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
          codigo_seq: r.copia?.codigo_seq ?? null,
          nombre_tienda: r.copia?.tienda?.nombre ?? null,
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
              codigo_seq: r.copia?.codigo_seq ?? null,
              nombre_tienda: r.copia?.tienda?.nombre ?? null,
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

/**
 * Consulta cuántas copias de un libro puede aún reservar el usuario.
 * Útil para que el frontend muestre el máximo seleccionable
 * antes de añadir al carrito.
 */
export async function getRemainingSlots(
  id_libro: string,
): Promise<RemainingSlotsResponse> {
  const roleCheck = await requireClientRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const user = await getCurrentUser();
    if (!user) return { ...rules.buildSessionRequiredResponse(), data: undefined };

    const libro = await getActiveLibroById(id_libro);
    if (!libro) {
      return {
        ...rules.buildLibroNotFoundResponse(),
        data: undefined,
      };
    }

    const disponiblesFisicas = (
      await getAvailableCopiaIdsByLibro(id_libro)
    ).length;

    const reservas = await getActiveReservasConLibro(user.id);
    const distinctLibros = new Set(
      reservas
        .map((r) => r.copia?.libro?.id)
        .filter(Boolean),
    );
    const copiasDeEsteLibro = reservas.filter(
      (r) => r.copia?.libro?.id === id_libro,
    ).length;

    const tieneEsteLibro = copiasDeEsteLibro > 0;
    const maxPorDiferentes = tieneEsteLibro
      ? Infinity
      : MAX_RESERVAS_DIFERENTES - distinctLibros.size;

    const maxPorMismoLibro = MAX_RESERVAS_MISMO_LIBRO - copiasDeEsteLibro;
    const puedeAgregar = maxPorDiferentes > 0;
    const efectivo = puedeAgregar
      ? Math.min(maxPorMismoLibro, disponiblesFisicas)
      : 0;

    return {
      success: true,
      data: {
        id_libro,
        titulo: libro.titulo,
        autor_nombre: libro.autor_nombre ?? null,
        isbn: libro.isbn,
        precio: libro.precio,
        copias_ya_reservadas: copiasDeEsteLibro,
        max_por_limite: Math.max(0, maxPorMismoLibro),
        disponibles_fisicas: disponiblesFisicas,
        efectivo: Math.max(0, efectivo),
        puede_agregar: puedeAgregar,
      },
    };
  } catch (error) {
    console.error(
      "[reservaService] Error inesperado al consultar slots disponibles:",
      error,
    );
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "Ocurrió un error al consultar la disponibilidad.",
      data: undefined,
    };
  }
}

/**
 * Reserva múltiples copias de un libro para el usuario actual.
 * Realiza un batch claim atómico seguido de batch insert.
 * Si no hay suficientes copias, retorna error sin modificar nada.
 */
export async function createReservaForBook(
  id_libro: string,
  cantidad: number,
): Promise<ReservaActionResponse> {
  const roleCheck = await requireClientRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const user = await getCurrentUser();
    if (!user) return rules.buildSessionRequiredResponse();

    const libro = await getActiveLibroById(id_libro);
    if (!libro) return rules.buildLibroNotFoundResponse();

    await cleanExpiredReservasInternal();

    const availableIds = await getAvailableCopiaIdsByLibro(id_libro, cantidad);

    if (availableIds.length < cantidad) {
      return rules.buildInsufficientCopiasResponse(cantidad, availableIds.length);
    }

    const copiaIds = await getCopiaIdsByLibro(id_libro);
    const reservasResumen = await getActiveReservasConLibro(user.id);
    const distinctLibros = new Set(
      reservasResumen
        .map((r) => r.copia?.libro?.id)
        .filter(Boolean),
    );
    const tieneEsteLibro = distinctLibros.has(id_libro);

    if (!tieneEsteLibro) {
      const librosAReservarConEste = distinctLibros.size + 1;
      if (librosAReservarConEste > MAX_RESERVAS_DIFERENTES) {
        return rules.buildExceedsMaxDifferentBooksResponse(distinctLibros.size);
      }
    }

    const sameBookCount = await countReservasByUserAndCopias(user.id, copiaIds);
    if (sameBookCount + cantidad > MAX_RESERVAS_MISMO_LIBRO) {
      return rules.buildExceedsMaxSameBookResponse(
        sameBookCount,
        libro.titulo,
      );
    }

    const claimedIds = await updateCopiaEstadoIfBatch(
      availableIds.slice(0, cantidad),
      "disponible",
      "reservado",
    );

    if (claimedIds.length < cantidad) {
      if (claimedIds.length > 0) {
        await updateCopiaEstadoIfBatch(claimedIds, "reservado", "disponible");
      }
      return rules.buildInsufficientCopiasResponse(cantidad, claimedIds.length);
    }

    try {
      await createReservasBatch(
        claimedIds.map((id_copia) => ({
          id_copia,
          id_usuario: user.id,
        })),
      );
    } catch (error) {
      await updateCopiaEstadoIfBatch(claimedIds, "reservado", "disponible");
      return {
        success: false,
        errors: { form: getErrorMessage(error) },
        message: "No se pudieron crear las reservas.",
      };
    }

    return rules.buildBookReservaSuccessResponse(cantidad);
  } catch (error) {
    console.error(
      "[reservaService] Error inesperado al reservar copias del libro:",
      error,
    );
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "Ocurrió un error inesperado al realizar la reserva.",
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
