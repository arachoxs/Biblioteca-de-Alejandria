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
  getActiveReservaBookIds,
  getReservaById,
  countReservasActivasByUser,
  countReservasByUserAndCopias,
  getReservasExpiradas,
} from "@/models/reservaModel";
import { MAX_RESERVAS_DIFERENTES, MAX_RESERVAS_MISMO_LIBRO } from "@/lib/types/reserva";
import type {
  ReservaActionResponse,
  ReservaAgrupadaItem,
  ReservaCopiaInfo,
  ReservaWithDetails,
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

    const limitError = await validateCreateReservaLimits(user.id, id_copia, libro);
    if (limitError) return limitError;

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

    return {
      success: true,
      data: groupReservationsByLibro(reservas),
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

    const byLibro = await getActiveReservaBookIds(user.id);
    const copiasDeEsteLibro = byLibro.get(id_libro)?.length ?? 0;
    const tieneEsteLibro = copiasDeEsteLibro > 0;
    const maxPorDiferentes = tieneEsteLibro
      ? Infinity
      : MAX_RESERVAS_DIFERENTES - byLibro.size;

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

    const limitError = await validateReservationLimits(
      user.id,
      id_libro,
      cantidad,
      libro.titulo,
    );
    if (limitError) return limitError;

    const claimError = await claimAndCreateReservas(
      user.id,
      availableIds,
      cantidad,
    );
    if (claimError) return claimError;

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

  try {
    await updateCopiaEstadoIfBatch(
      expiradas.map((r) => r.id_copia),
      "reservado",
      "disponible",
    );
  } catch (error) {
    console.error(
      "[reservaService] Error al liberar copias expiradas en batch:",
      error,
    );
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

/**
 * Valida que el usuario no exceda los límites al crear una reserva:
 * 1. Máximo de libros diferentes (MAX_RESERVAS_DIFERENTES)
 * 2. Máximo de copias del mismo libro (MAX_RESERVAS_MISMO_LIBRO)
 * Retorna un error response si excede algún límite, o null si todo ok.
 * Extraída para reducir la CC de createReserva (era 11, ahora ~7).
 */
async function validateCreateReservaLimits(
  userId: string,
  copiaId: string,
  libro: { id: string; titulo: string } | null,
): Promise<ReservaActionResponse | null> {
  const activeCount = await countReservasActivasByUser(userId);
  if (activeCount >= MAX_RESERVAS_DIFERENTES) {
    await safeRollback(copiaId);
    return rules.buildExceedsMaxDifferentBooksResponse(activeCount);
  }

  if (libro) {
    const copiaIds = await getCopiaIdsByLibro(libro.id);
    const sameBookCount = await countReservasByUserAndCopias(userId, copiaIds);
    if (sameBookCount >= MAX_RESERVAS_MISMO_LIBRO) {
      await safeRollback(copiaId);
      return rules.buildExceedsMaxSameBookResponse(sameBookCount, libro.titulo);
    }
  }

  return null;
}

/**
 * Agrupa las reservas activas por libro, retornando un array de
 * ReservaAgrupadaItem listo para la respuesta de getReservasSummary.
 * Extraída para reducir la CC de getReservasSummary (era 16, ahora ~6).
 */
function groupReservationsByLibro(
  reservas: ReservaWithDetails[],
): ReservaAgrupadaItem[] {
  return reservas.reduce<ReservaAgrupadaItem[]>((acc, r) => {
    const libro = r.copia?.libro;
    if (!libro) return acc;
    return accumulateGroup(acc, libro, r);
  }, []);
}

function accumulateGroup(
  acc: ReservaAgrupadaItem[],
  libro: NonNullable<ReservaCopiaInfo["libro"]>,
  r: ReservaWithDetails,
): ReservaAgrupadaItem[] {
  const existing = acc.find((item) => item.id_libro === libro.id);

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
    acc.push({
      id_libro: libro.id,
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

  return acc;
}

/**
 * Valida que el usuario no exceda los límites de libros diferentes (5)
 * ni de copias del mismo libro (3) al hacer una reserva batch.
 * Retorna un error response si excede algún límite, o null si todo ok.
 * Extraída para reducir la CC de createReservaForBook (era 13, ahora ~6).
 */
async function validateReservationLimits(
  userId: string,
  id_libro: string,
  cantidad: number,
  libroTitulo: string,
): Promise<ReservaActionResponse | null> {
  const byLibro = await getActiveReservaBookIds(userId);
  const tieneEsteLibro = byLibro.has(id_libro);

  if (!tieneEsteLibro) {
    const librosAReservarConEste = byLibro.size + 1;
    if (librosAReservarConEste > MAX_RESERVAS_DIFERENTES) {
      return rules.buildExceedsMaxDifferentBooksResponse(byLibro.size);
    }
  }

  const sameBookCount = byLibro.get(id_libro)?.length ?? 0;
  if (sameBookCount + cantidad > MAX_RESERVAS_MISMO_LIBRO) {
    return rules.buildExceedsMaxSameBookResponse(
      sameBookCount,
      libroTitulo,
    );
  }

  return null;
}

/**
 * Reclama atómicamente N copias (disponible → reservado) y crea las
 * reservas en BD. Si el claim falla, hace rollback parcial. Si el
 * insert falla, revierte el claim. Retorna null en éxito o un error.
 * Extraída para reducir CC y LOC de createReservaForBook.
 */
async function claimAndCreateReservas(
  userId: string,
  availableIds: string[],
  cantidad: number,
): Promise<ReservaActionResponse | null> {
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
        id_usuario: userId,
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

  return null;
}
