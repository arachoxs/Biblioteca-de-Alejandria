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
  createReserva,
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

  try {
    await createReserva({ id_copia: newCopiaId, id_usuario: userId });
  } catch (error) {
    console.error("[checkoutEnvioService] Error creando reserva durante swap:", error);
    await updateCopiaEstadoIf(newCopiaId, "reservado", "disponible");
    return { swapped: false, oldCopiaId: null, newCopiaId: null };
  }

  return { swapped: true, oldCopiaId, newCopiaId };
}

// ─── Calcular Opciones ──────────────────────────────────────────────

type ClasificacionLibros = {
  swappedBooks: SwappedBook[]
  needsTrasladoLibros: string[]
  libroTitulosMap: Map<string, string>
}

interface ClasificacionConfig {
  libroIds: string[]
  libroTitulosMap: Map<string, string>
  nearestStoreId: string
  nearestAvailableBooks: Set<string>
  userId: string
}

interface TrasladoConfig {
  needsTrasladoLibros: string[]
  libroTitulosMap: Map<string, string>
  libroIds: string[]
}

async function clasificarLibrosParaTienda(
  config: ClasificacionConfig,
): Promise<ClasificacionLibros> {
  const { libroIds, libroTitulosMap, nearestStoreId, nearestAvailableBooks, userId } = config
  const swappedBooks: SwappedBook[] = []
  const needsTrasladoLibros: string[] = []

  const clasificacion = { swappedBooks, needsTrasladoLibros, libroTitulosMap }

  for (const libroId of libroIds) {
    const hasReservaAtNearest = await getActiveReservaForLibroAtTienda(
      userId,
      libroId,
      nearestStoreId,
    )

    if (hasReservaAtNearest) continue

    const bookNeedsTransfer = classifyBookStatus(libroId, nearestAvailableBooks)

    if (bookNeedsTransfer) {
      needsTrasladoLibros.push(libroId)
    } else {
      await attemptBookSwap(userId, libroId, nearestStoreId, clasificacion)
    }
  }

  return { swappedBooks, needsTrasladoLibros, libroTitulosMap }
}

async function attemptBookSwap(
  userId: string,
  libroId: string,
  nearestStoreId: string,
  clasificacion: ClasificacionLibros,
): Promise<void> {
  const titulo = clasificacion.libroTitulosMap.get(libroId) ?? ""
  const result = await performSwapIfNeeded(userId, libroId, titulo, nearestStoreId)

  if (isSwapSuccessful(result)) {
    clasificacion.swappedBooks.push({
      libroId,
      titulo,
      oldCopiaId: result.oldCopiaId,
      newCopiaId: result.newCopiaId,
    })
  } else {
    clasificacion.needsTrasladoLibros.push(libroId)
  }
}

function classifyBookStatus(libroId: string, nearestAvailableBooks: Set<string>): boolean {
  return !nearestAvailableBooks.has(libroId)
}

function isSwapSuccessful(result: { swapped: boolean; oldCopiaId: string | null; newCopiaId: string | null }): result is { swapped: true; oldCopiaId: string; newCopiaId: string } {
  return result.swapped && result.oldCopiaId !== null && result.newCopiaId !== null
}

type TiendaConDistancia = {
  id: string
  nombre: string
  direccion_formateada: string
  place_id: string
  distanciaKm: number
  duracionMin: number
}

function buildTiendasConDistancia(
  tiendas: { id: string; nombre: string; direccion_formateada: string; place_id: string }[],
  distances: { distanciaKm: number; duracionMin: number }[],
): TiendaConDistancia[] {
  return tiendas
    .map((t, i) => ({
      id: t.id,
      nombre: t.nombre,
      direccion_formateada: t.direccion_formateada,
      place_id: t.place_id,
      distanciaKm: distances[i]?.distanciaKm ?? Infinity,
      duracionMin: distances[i]?.duracionMin ?? Infinity,
    }))
    .sort((a, b) => a.distanciaKm - b.distanciaKm)
}

function extractLibroIdsAndTitulos(
  summary: { id_libro: string; titulo: string }[],
): { libroIds: string[]; libroTitulosMap: Map<string, string> } {
  const libroIds: string[] = []
  const libroTitulosMap = new Map<string, string>()
  for (const item of summary) {
    libroIds.push(item.id_libro)
    libroTitulosMap.set(item.id_libro, item.titulo)
  }
  return { libroIds, libroTitulosMap }
}

function findTiendasConTodosLosLibros(
  libroIds: string[],
  tiendas: { id: string }[],
  allDisponibilidad: { tiendaId: string; libroId: string }[],
): string[] {
  const result: string[] = []
  for (const tienda of tiendas) {
    const disponiblesEnTienda = allDisponibilidad.filter((d) => d.tiendaId === tienda.id)
    const disponiblesSet = new Set(disponiblesEnTienda.map((d) => d.libroId))
    if (libroIds.every((id) => disponiblesSet.has(id))) {
      result.push(tienda.id)
    }
  }
  return result
}

interface OpcionesBuildConfig {
  nearestStore: TiendaConDistancia
  libroIds: string[]
  clasificacion: ClasificacionLibros
  tiendasConTodosLosLibros: string[]
  tiendasConDistancia: TiendaConDistancia[]
}

function buildDomicilioOption(
  nearestStore: TiendaConDistancia,
  needsTrasladoLibros: string[],
): OpcionEnvio {
  const costoDomicilio = calcularCostoEnvio(nearestStore.distanciaKm)
  return {
    tipo: "domicilio",
    tiendaId: null,
    tiendaNombre: null,
    tiendaPlaceId: null,
    tiendaDireccion: null,
    costo: costoDomicilio,
    mensaje:
      costoDomicilio === 0
        ? "Envío gratuito (menos de 5 km)"
        : `Costo de envío: $${costoDomicilio.toLocaleString("es-CO")} COP`,
    requiereTraslado: needsTrasladoLibros.length > 0,
  }
}

function buildRecogidaOptionReady(
  nearestStore: TiendaConDistancia,
  swappedBooks: SwappedBook[],
  libroIds: string[],
): OpcionEnvio {
  const readyCount = libroIds.length - swappedBooks.length
  const swappedCount = swappedBooks.length
  return {
    tipo: "recogida",
    tiendaId: nearestStore.id,
    tiendaNombre: nearestStore.nombre,
    tiendaPlaceId: nearestStore.place_id,
    tiendaDireccion: nearestStore.direccion_formateada,
    costo: 0,
    mensaje:
      swappedCount > 0
        ? `${readyCount} libros listos, ${swappedCount} intercambiados en ${nearestStore.nombre} (${nearestStore.distanciaKm} km)`
        : `Recoge en ${nearestStore.nombre} (${nearestStore.distanciaKm} km - ${nearestStore.duracionMin} min)`,
    requiereTraslado: false,
    swappedBooks: swappedBooks.length > 0 ? swappedBooks : undefined,
  }
}

function buildRecogidaOptionTraslado(
  nearestStore: TiendaConDistancia,
  swappedBooks: SwappedBook[],
  config: TrasladoConfig,
): OpcionEnvio {
  const readyCount = config.libroIds.length - config.needsTrasladoLibros.length
  const costoDomicilio = calcularCostoEnvio(nearestStore.distanciaKm)
  return {
    tipo: "recogida",
    tiendaId: nearestStore.id,
    tiendaNombre: nearestStore.nombre,
    tiendaPlaceId: nearestStore.place_id,
    tiendaDireccion: nearestStore.direccion_formateada,
    costo: 0,
    mensaje: `${readyCount} libros listos, ${config.needsTrasladoLibros.length} en tránsito (3-5 días hábiles)`,
    requiereTraslado: true,
    swappedBooks: swappedBooks.length > 0 ? swappedBooks : undefined,
    trasladoDetalle: {
      libroIds: config.needsTrasladoLibros,
      titulos: config.needsTrasladoLibros.map((id) => config.libroTitulosMap.get(id) ?? ""),
      diasLaborales: 3,
      costo: costoDomicilio,
    },
  }
}

function buildTiendaOption(
  tiendaData: TiendaConDistancia,
): OpcionEnvio {
  return {
    tipo: "recogida",
    tiendaId: tiendaData.id,
    tiendaNombre: tiendaData.nombre,
    tiendaPlaceId: tiendaData.place_id,
    tiendaDireccion: tiendaData.direccion_formateada,
    costo: 0,
    mensaje: `Recoge en ${tiendaData.nombre} (${tiendaData.distanciaKm} km - ${tiendaData.duracionMin} min)`,
    requiereTraslado: false,
  }
}

function construirOpcionesEnvio(config: OpcionesBuildConfig): OpcionEnvio[] {
  const { nearestStore, libroIds, clasificacion, tiendasConTodosLosLibros, tiendasConDistancia } = config
  const opciones: OpcionEnvio[] = []
  const { swappedBooks, needsTrasladoLibros, libroTitulosMap } = clasificacion

  opciones.push(buildDomicilioOption(nearestStore, needsTrasladoLibros))

  if (needsTrasladoLibros.length === 0) {
    opciones.push(buildRecogidaOptionReady(nearestStore, swappedBooks, libroIds))
  } else {
    opciones.push(buildRecogidaOptionTraslado(
      nearestStore,
      swappedBooks,
      { needsTrasladoLibros, libroTitulosMap, libroIds },
    ))
  }

  for (const tiendaId of tiendasConTodosLosLibros) {
    if (tiendaId === nearestStore.id) continue
    const tiendaData = tiendasConDistancia.find((t) => t.id === tiendaId)
    if (!tiendaData) continue
    opciones.push(buildTiendaOption(tiendaData))
  }

  return opciones
}

async function fetchDisponibilidadParaClasificacion(
  libroIds: string[],
  nearestStoreId: string,
  allTiendaIds: string[],
) {
  const nearestDisponibilidad = await getDisponibilidadMultiTienda(libroIds, [nearestStoreId])
  const nearestAvailableBooks = new Set(nearestDisponibilidad.map((d) => d.libroId))
  const allDisponibilidad = await getDisponibilidadMultiTienda(libroIds, allTiendaIds)
  return { nearestAvailableBooks, allDisponibilidad }
}

export async function calcularOpcionesEnvio(
  userPlaceId?: string,
): Promise<ResultadoEnvio> {
  const user = await getCurrentUser()
  if (!user) return { tiendaMasCercana: null, opciones: [] }

  const resolvedPlaceId = userPlaceId ?? (await getUserPlaceId(user.id))
  if (!resolvedPlaceId) return { tiendaMasCercana: null, opciones: [] }

  const tiendas = await getTiendasConDireccion()
  if (tiendas.length === 0) return { tiendaMasCercana: null, opciones: [] }

  const distances = await getDistanciaOrigenDestino(
    resolvedPlaceId,
    tiendas.map((t) => t.place_id),
  )

  const tiendasConDistancia = buildTiendasConDistancia(tiendas, distances)
  const nearestStore = tiendasConDistancia[0]

  const summary = await getReservasSummary()
  const { libroIds, libroTitulosMap } = summary.success && summary.data
    ? extractLibroIdsAndTitulos(summary.data)
    : { libroIds: [], libroTitulosMap: new Map() }

  const allTiendaIds = tiendas.map((t) => t.id)
  const { nearestAvailableBooks, allDisponibilidad } = await fetchDisponibilidadParaClasificacion(
    libroIds,
    nearestStore.id,
    allTiendaIds,
  )

  const clasificacion = await clasificarLibrosParaTienda({
    libroIds,
    libroTitulosMap,
    nearestStoreId: nearestStore.id,
    nearestAvailableBooks,
    userId: user.id,
  })

  const tiendasConTodosLosLibros = findTiendasConTodosLosLibros(libroIds, tiendas, allDisponibilidad)

  const opciones = construirOpcionesEnvio({
    nearestStore,
    libroIds,
    clasificacion,
    tiendasConTodosLosLibros,
    tiendasConDistancia,
  })

  return { tiendaMasCercana: nearestStore, opciones }
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
