import "server-only"

import { getCurrentUser } from "@/models/authModel"
import {
  getTiendasConDireccion,
  getDisponibilidadMultiTienda,
  getUserPlaceId,
} from "@/models/checkoutModel"
import {
  transferCopias,
  getAvailableCopiaIdsByLibroAtStore,
  updateCopiaEstadoIf,
} from "@/models/copiaModel"
import {
  getDistanciaOrigenDestino,
  calcularCostoEnvio,
} from "@/lib/services/googleMapsService"
import { getReservasSummary } from "@/services/reservas/reservaService"
import {
  getActiveReservaForLibroAtTienda,
  getActiveReservaOfLibro,
  deleteReserva,
} from "@/models/reservaModel"
import type { ResultadoEnvio, OpcionEnvio, SwappedBook } from "@/lib/types/checkout"

// ─── Swap Logic ─────────────────────────────────────────────────────

/**
 * Realiza un swap de reserva de un libro a una tienda destino.
 *
 * Flujo:
 * 1. Si el usuario ya tiene reserva en la tienda destino → skip (ya tiene)
 * 2. Si no hay copia disponible en la tienda destino → no se puede hacer swap
 * 3. Si el usuario no tiene reserva activa del libro → no se puede hacer swap
 * 4. Swap: libera oldCopia, elimina oldReserva, crea nueva reserva en newCopia
 */
async function performSwapIfNeeded(
  userId: string,
  libroId: string,
  titulo: string,
  tiendaDestinoId: string,
): Promise<{ swapped: boolean; oldCopiaId: string | null; newCopiaId: string | null }> {
  // 1. Si ya tiene reserva en esta tienda, skip
  const existingReserva = await getActiveReservaForLibroAtTienda(
    userId,
    libroId,
    tiendaDestinoId,
  );
  if (existingReserva) {
    return { swapped: false, oldCopiaId: null, newCopiaId: null };
  }

  // 2. Si no hay copia disponible en tienda destino, no se puede swap
  const availableCopias = await getAvailableCopiaIdsByLibroAtStore(libroId, tiendaDestinoId, 1);
  if (availableCopias.length === 0) {
    return { swapped: false, oldCopiaId: null, newCopiaId: null };
  }
  const newCopiaId = availableCopias[0];

  // 3. Obtener la reserva activa del usuario para este libro (cualquier tienda)
  const oldReserva = await getActiveReservaOfLibro(userId, libroId);
  if (!oldReserva) {
    return { swapped: false, oldCopiaId: null, newCopiaId: null };
  }

  const oldCopiaId = oldReserva.id_copia;

  // 4. SWAP atómico
  // Liberar la copia vieja (reservado → disponible)
  const released = await updateCopiaEstadoIf(oldCopiaId, "reservado", "disponible");
  if (!released) {
    console.warn(
      `[checkoutEnvioService] No se pudo liberar copia ${oldCopiaId} durante swap`,
    );
    return { swapped: false, oldCopiaId: null, newCopiaId: null };
  }

  // Eliminar la reserva vieja
  await deleteReserva(oldReserva.id);

  // Reclamar la nueva copia (disponible → reservado) y crear reserva
  // Usamos createReserva del servicio que maneja el claim y la creación de reserva
  const newCopiaClaimed = await updateCopiaEstadoIf(newCopiaId, "disponible", "reservado");
  if (!newCopiaClaimed) {
    // Rollback: devolver la vieja a reservado
    await updateCopiaEstadoIf(oldCopiaId, "disponible", "reservado");
    return { swapped: false, oldCopiaId: null, newCopiaId: null };
  }

  // Crear la reserva para la nueva copia usando el modelo directamente
  // (el servicio createReserva hace claim automático, pero ya hicimos el claim manualmente)
  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminClient = createAdminClient();
  const { error: reservaError } = await adminClient
    .from("reserva")
    .insert({ id_copia: newCopiaId, id_usuario: userId });

  if (reservaError) {
    console.error("[checkoutEnvioService] Error creando reserva durante swap:", reservaError);
    // Rollback del claim
    await updateCopiaEstadoIf(newCopiaId, "reservado", "disponible");
    return { swapped: false, oldCopiaId: null, newCopiaId: null };
  }

  return { swapped: true, oldCopiaId, newCopiaId };
}

// ─── Calcular Opciones ──────────────────────────────────────────────

export async function calcularOpcionesEnvio(
  userPlaceId?: string,
): Promise<ResultadoEnvio> {
  const user = await getCurrentUser()
  if (!user) {
    return { tiendaMasCercana: null, opciones: [] }
  }

  const resolvedPlaceId = userPlaceId ?? (await getUserPlaceId(user.id))
  if (!resolvedPlaceId) {
    return { tiendaMasCercana: null, opciones: [] }
  }

  const tiendas = await getTiendasConDireccion()
  if (tiendas.length === 0) {
    return { tiendaMasCercana: null, opciones: [] }
  }

  const distances = await getDistanciaOrigenDestino(
    resolvedPlaceId,
    tiendas.map((t) => t.place_id),
  )

  const tiendasConDistancia = tiendas
    .map((t, i) => ({
      ...t,
      distanciaKm: distances[i]?.distanciaKm ?? Infinity,
      duracionMin: distances[i]?.duracionMin ?? Infinity,
    }))
    .sort((a, b) => a.distanciaKm - b.distanciaKm)

  const nearestStore = tiendasConDistancia[0]

  const summary = await getReservasSummary()
  const libroIds: string[] = []
  const libroTitulosMap = new Map<string, string>()
  if (summary.success && summary.data) {
    for (const item of summary.data) {
      libroIds.push(item.id_libro)
      libroTitulosMap.set(item.id_libro, item.titulo)
    }
  }

  const nearestDisponibilidad = await getDisponibilidadMultiTienda(libroIds, [
    nearestStore.id,
  ])

  const nearestAvailableBooks = new Set(
    nearestDisponibilidad.map((d) => d.libroId),
  )

  // Clasificar libros: ready (ya tiene reserva en nearest) vs needsSwap vs needsTraslado
  const swappedBooks: SwappedBook[] = [];
  const needsTrasladoLibros: string[] = [];

  for (const libroId of libroIds) {
    // ¿Ya tiene reserva activa en la tienda nearest?
    const hasReservaAtNearest = await getActiveReservaForLibroAtTienda(
      user.id,
      libroId,
      nearestStore.id,
    );

    if (hasReservaAtNearest) {
      // Ya tiene reserva en nearest, está "ready"
      continue;
    }

    // ¿Hay copia disponible en nearest?
    if (nearestAvailableBooks.has(libroId)) {
      // Intentamos swap
      const titulo = libroTitulosMap.get(libroId) ?? "";
      const result = await performSwapIfNeeded(
        user.id,
        libroId,
        titulo,
        nearestStore.id,
      );

      if (result.swapped && result.oldCopiaId && result.newCopiaId) {
        swappedBooks.push({
          libroId,
          titulo,
          oldCopiaId: result.oldCopiaId,
          newCopiaId: result.newCopiaId,
        });
      } else {
        // Swap falló, necesita traslado
        needsTrasladoLibros.push(libroId);
      }
    } else {
      // No hay copia disponible en nearest, necesita traslado
      needsTrasladoLibros.push(libroId);
    }
  }

  const allTiendaIds = tiendas.map((t) => t.id)
  const allDisponibilidad = await getDisponibilidadMultiTienda(
    libroIds,
    allTiendaIds,
  )

  const tiendasConTodosLosLibros: string[] = []
  for (const tienda of tiendas) {
    const disponiblesEnTienda = allDisponibilidad.filter(
      (d) => d.tiendaId === tienda.id,
    )
    const disponiblesSet = new Set(disponiblesEnTienda.map((d) => d.libroId))
    if (libroIds.every((id) => disponiblesSet.has(id))) {
      tiendasConTodosLosLibros.push(tienda.id)
    }
  }

  const opciones: OpcionEnvio[] = []

  const costoDomicilio = calcularCostoEnvio(nearestStore.distanciaKm)
  const domicilioMsg =
    costoDomicilio === 0
      ? "Envío gratuito (menos de 5 km)"
      : `Costo de envío: $${costoDomicilio.toLocaleString("es-CO")} COP`

  opciones.push({
    tipo: "domicilio",
    tiendaId: null,
    tiendaNombre: null,
    tiendaPlaceId: null,
    tiendaDireccion: null,
    costo: costoDomicilio,
    mensaje: domicilioMsg,
    requiereTraslado: needsTrasladoLibros.length > 0,
  })

  // Opción de recogida/pickup
  if (needsTrasladoLibros.length === 0) {
    // Todos los libros están ready (ya sea por reserva existente o por swap)
    const readyCount = libroIds.length - swappedBooks.length;
    const swappedCount = swappedBooks.length;
    const mensaje = swappedCount > 0
      ? `${readyCount} libros listos, ${swappedCount} intercambiados en ${nearestStore.nombre} (${nearestStore.distanciaKm} km)`
      : `Recoge en ${nearestStore.nombre} (${nearestStore.distanciaKm} km - ${nearestStore.duracionMin} min)`;

    opciones.push({
      tipo: "recogida",
      tiendaId: nearestStore.id,
      tiendaNombre: nearestStore.nombre,
      tiendaPlaceId: nearestStore.place_id,
      tiendaDireccion: nearestStore.direccion_formateada,
      costo: 0,
      mensaje,
      requiereTraslado: false,
      swappedBooks: swappedBooks.length > 0 ? swappedBooks : undefined,
    })
  } else {
    // Algunos libros necesitan traslado
    const readyCount = libroIds.length - needsTrasladoLibros.length;
    const trasladoTitulos = needsTrasladoLibros.map((id) => libroTitulosMap.get(id) ?? "");
    const costoTraslado = calcularCostoEnvio(nearestStore.distanciaKm);

    opciones.push({
      tipo: "recogida",
      tiendaId: nearestStore.id,
      tiendaNombre: nearestStore.nombre,
      tiendaPlaceId: nearestStore.place_id,
      tiendaDireccion: nearestStore.direccion_formateada,
      costo: 0,
      mensaje: `${readyCount} libros listos, ${needsTrasladoLibros.length} en tránsito (3-5 días hábiles)`,
      requiereTraslado: true,
      swappedBooks: swappedBooks.length > 0 ? swappedBooks : undefined,
      trasladoDetalle: {
        libroIds: needsTrasladoLibros,
        titulos: trasladoTitulos,
        diasLaborales: 3,
        costo: costoTraslado,
      },
    })
  }

  for (const tiendaId of tiendasConTodosLosLibros) {
    if (tiendaId !== nearestStore.id) {
      const tiendaData = tiendasConDistancia.find((t) => t.id === tiendaId)
      if (tiendaData) {
        opciones.push({
          tipo: "recogida",
          tiendaId: tiendaData.id,
          tiendaNombre: tiendaData.nombre,
          tiendaPlaceId: tiendaData.place_id,
          tiendaDireccion: tiendaData.direccion_formateada,
          costo: 0,
          mensaje: `Recoge en ${tiendaData.nombre} (${tiendaData.distanciaKm} km - ${tiendaData.duracionMin} min)`,
          requiereTraslado: false,
        })
      }
    }
  }

  return {
    tiendaMasCercana: nearestStore,
    opciones,
  }
}

export async function ejecutarTraslados(
  copiaIds: string[],
  tiendaDestinoId: string,
): Promise<{ transferidos: string[]; fallidos: string[] }> {
  if (copiaIds.length === 0) return { transferidos: [], fallidos: [] };
  const result = await transferCopias(copiaIds, tiendaDestinoId);
  if (result.fallidos.length > 0) {
    console.warn(
      `[checkoutEnvioService] Algunas copias no fueron trasladadas: ${result.fallidos.length} fallidos`,
    );
  }
  return result;
}
