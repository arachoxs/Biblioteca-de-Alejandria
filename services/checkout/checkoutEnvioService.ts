import "server-only"

import { getCurrentUser } from "@/models/authModel"
import {
  getTiendasConDireccion,
  getDisponibilidadMultiTienda,
  getUserPlaceId,
} from "@/models/checkoutModel"
import { transferCopias } from "@/models/copiaModel"
import {
  getDistanciaOrigenDestino,
  calcularCostoEnvio,
} from "@/lib/services/googleMapsService"
import { getReservasSummary } from "@/services/reservas/reservaService"
import type { ResultadoEnvio, OpcionEnvio } from "@/lib/types/checkout"

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
  if (summary.success && summary.data) {
    for (const item of summary.data) {
      libroIds.push(item.id_libro)
    }
  }

  const nearestDisponibilidad = await getDisponibilidadMultiTienda(libroIds, [
    nearestStore.id,
  ])

  const nearestAvailableBooks = new Set(
    nearestDisponibilidad.map((d) => d.libroId),
  )
  const missingBooks = libroIds.filter((id) => !nearestAvailableBooks.has(id))
  const allAvailableAtNearest = missingBooks.length === 0

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
    requiereTraslado: false,
  })

  if (allAvailableAtNearest) {
    opciones.push({
      tipo: "recogida",
      tiendaId: nearestStore.id,
      tiendaNombre: nearestStore.nombre,
      tiendaPlaceId: nearestStore.place_id,
      tiendaDireccion: nearestStore.direccion_formateada,
      costo: 0,
      mensaje: `Recoge en ${nearestStore.nombre} (${nearestStore.distanciaKm} km - ${nearestStore.duracionMin} min)`,
      requiereTraslado: false,
    })
  } else {
    opciones.push({
      tipo: "traslado",
      tiendaId: nearestStore.id,
      tiendaNombre: nearestStore.nombre,
      tiendaPlaceId: nearestStore.place_id,
      tiendaDireccion: nearestStore.direccion_formateada,
      costo: 0,
      mensaje: `Traslado a ${nearestStore.nombre} (3-5 días hábiles)`,
      requiereTraslado: true,
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
): Promise<void> {
  if (copiaIds.length === 0) return
  await transferCopias(copiaIds, tiendaDestinoId)
}
