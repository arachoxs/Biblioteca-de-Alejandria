"use server"

import "server-only"

import {
  calcularOpcionesEnvio,
  ejecutarTraslados,
} from "@/services/checkout/checkoutEnvioService"
import {
  registrarCompra,
  type RegistrarCompraInput,
  type RegistrarCompraResponse,
} from "@/services/compra/compraService"
import { getCurrentUser } from "@/models/authModel"
import { getUserPlaceId, getUserFullAddress } from "@/models/checkoutModel"
import { getTarjetasByUserId } from "@/models/tarjetaModel"
import { getActiveTiendaById } from "@/models/tiendaModel"
import { getUserProfileById } from "@/models/userModel"
import type {
  ResultadoEnvio,
  TarjetaPaymentAllocation,
  PaymentAllocationValidation,
} from "@/lib/types/checkout"

export async function calcularEnvioAction(
  userPlaceId?: string,
  soloTiendaMasCercana?: boolean,
): Promise<ResultadoEnvio> {
  try {
    return await calcularOpcionesEnvio(userPlaceId, soloTiendaMasCercana)
  } catch (error) {
    console.error("[calcularEnvioAction]", error)
    return { tiendaMasCercana: null, opciones: [] }
  }
}

export async function getProfileAddressAction(): Promise<string | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null
    return getUserPlaceId(user.id)
  } catch (error) {
    console.error("[getProfileAddressAction]", error)
    return null
  }
}

export async function getProfileFullAddressAction(): Promise<{
  placeId: string | null
  direccionFormateada: string | null
}> {
  try {
    const user = await getCurrentUser()
    if (!user) return { placeId: null, direccionFormateada: null }
    return getUserFullAddress(user.id)
  } catch (error) {
    console.error("[getProfileFullAddressAction]", error)
    return { placeId: null, direccionFormateada: null }
  }
}

export type TransferirCopiaInput = {
  copiaIds: string[]
  tiendaDestinoId: string
}

export async function transferirCopiasAction(
  input: TransferirCopiaInput,
): Promise<{ success: boolean; message: string }> {
  try {
    await ejecutarTraslados(input.copiaIds, input.tiendaDestinoId)
    return { success: true, message: "Traslado completado exitosamente." }
  } catch {
    return {
      success: false,
      message: "Error al realizar el traslado.",
    }
  }
}

const TOLERANCIA_COP = 1
const MAX_SINGLE_ALLOCATION = 1_000_000_000

export interface GetUserTarjetasResponse {
  success: boolean
  tarjetas?: Array<{
    id: number
    nombre_titular: string
    ultimos_cuatro_digitos: string
    mes_caducidad: number
    ano_caducidad: number
    saldo: number
  }>
  error?: string
}

export async function getUserTarjetasAction(): Promise<GetUserTarjetasResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "No hay sesión activa." }
    }

    const tarjetas = await getTarjetasByUserId(user.id)
    return {
      success: true,
      tarjetas: tarjetas.map((t) => ({
        id: t.id,
        nombre_titular: t.nombre_titular ?? "",
        ultimos_cuatro_digitos: t.ultimos_cuatro_digitos,
        mes_caducidad: t.mes_caducidad,
        ano_caducidad: t.ano_caducidad,
        saldo: t.saldo,
      })),
    }
  } catch (error) {
    console.error("[getUserTarjetasAction]", error)
    return {
      success: false,
      error: "Error al obtener las tarjetas.",
    }
  }
}

function formatCurrencyDiff(cop: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(cop)
}

function buildFormError(totalAllocated: number, totalRequired: number): string {
  if (totalAllocated < totalRequired) {
    return `Faltan ${formatCurrencyDiff(totalRequired - totalAllocated)}`
  }
  return `Exceso de ${formatCurrencyDiff(totalAllocated - totalRequired)}`
}

interface AllocationValidationResult {
  errors: Record<string, string>
  insufficientCards: PaymentAllocationValidation["insufficientCards"]
  totalAllocated: number
}

function validateAllocation(
  allocation: TarjetaPaymentAllocation,
  tarjeta: { id: number; saldo: number } | undefined,
): string | null {
  if (!tarjeta) return "Tarjeta no encontrada."
  if (allocation.monto <= 0) return "El monto debe ser mayor a 0."
  if (allocation.monto > MAX_SINGLE_ALLOCATION) return "El monto excede el límite permitido."
  return null
}

function processAllocations(
  allocations: TarjetaPaymentAllocation[],
  tarjetaMap: Map<number, { id: number; saldo: number }>,
): AllocationValidationResult {
  const errors: Record<string, string> = {}
  const insufficientCards: PaymentAllocationValidation["insufficientCards"] = []
  let totalAllocated = 0

  for (const allocation of allocations) {
    const tarjeta = tarjetaMap.get(allocation.id_tarjeta)
    const error = validateAllocation(allocation, tarjeta)

    if (error) {
      errors[`tarjeta_${allocation.id_tarjeta}`] = error
      continue
    }

    const matchedTarjeta = tarjeta!
    if (allocation.monto > matchedTarjeta.saldo) {
      insufficientCards.push({
        id_tarjeta: allocation.id_tarjeta,
        saldo: matchedTarjeta.saldo,
        monto: allocation.monto,
      })
    }
    totalAllocated += allocation.monto
  }

  return { errors, insufficientCards, totalAllocated }
}

export async function validatePaymentAllocationAction(
  allocations: TarjetaPaymentAllocation[],
  totalRequired: number,
): Promise<PaymentAllocationValidation> {
  if (!allocations || allocations.length === 0) {
    return {
      isValid: false,
      totalAllocated: 0,
      totalRequired,
      insufficientCards: [],
      errors: { form: "Debes seleccionar al menos una tarjeta." },
    }
  }

  const user = await getCurrentUser()
  if (!user) {
    return {
      isValid: false,
      totalAllocated: 0,
      totalRequired,
      insufficientCards: [],
      errors: { form: "No hay sesión activa." },
    }
  }

  const tarjetas = await getTarjetasByUserId(user.id)
  const tarjetaMap = new Map(tarjetas.map((t) => [t.id, t]))
  const { errors, insufficientCards, totalAllocated } = processAllocations(allocations, tarjetaMap)

  const diferencia = Math.abs(totalAllocated - totalRequired)
  const isValid =
    diferencia <= TOLERANCIA_COP &&
    insufficientCards.length === 0 &&
    Object.keys(errors).length === 0

  if (!isValid && diferencia > TOLERANCIA_COP) {
    errors.form = buildFormError(totalAllocated, totalRequired)
  }

  return {
    isValid,
    totalAllocated,
    totalRequired,
    insufficientCards,
    errors,
  }
}

// ─── Final confirmation ─────────────────────────────────────────────

export interface ConfirmarCompraActionInput {
  subtotal: number
  total: number
  copias: { id_copia: string; monto: number }[]
  tarjetas: { id_tarjeta: number; monto: number }[]
  entrega: {
    tipo: "domicilio" | "recogida" | "traslado"
    id_tienda_destino: string
    costo: number
  }
}

export type ConfirmarCompraResponse = RegistrarCompraResponse

const TIPOS_ENTREGA_VALIDOS = ["domicilio", "recogida", "traslado"] as const

function mapTipoEntrega(tipo: string): "envio" | "recogida" {
  // "domicilio" → "envio" (entrega a domicilio)
  // "recogida" y "traslado" → "recogida" (el usuario recoge en tienda;
  //   el traslado físico de copias se maneja por separado vía transferirCopiasAction)
  return tipo === "domicilio" ? "envio" : "recogida"
}

type DireccionDestinoResult =
  | { ok: true; id_direccion: number }
  | { ok: false; errors: Record<string, string> }

async function resolveDireccionDestino(
  user: { id: string },
  tipoEntrega: "envio" | "recogida",
  idTiendaDestino: string,
): Promise<DireccionDestinoResult> {
  const tienda = await getActiveTiendaById(idTiendaDestino)
  if (!tienda) return { ok: false, errors: { tienda: "TIENDA_NO_ENCONTRADA" } }

  const userProfile = await getUserProfileById(user.id)
  if (!userProfile) return { ok: false, errors: { usuario: "USUARIO_NO_ENCONTRADO" } }

  if (tipoEntrega === "envio") {
    if (!userProfile.id_direccion) return { ok: false, errors: { direccion: "DIRECCION_NO_ENCONTRADA" } }
    return { ok: true, id_direccion: userProfile.id_direccion }
  }

  return { ok: true, id_direccion: tienda.id_direccion }
}

function computeFechaEntregaEstimada(): string {
  const date = new Date()
  let businessDays = 0
  while (businessDays < 3) {
    date.setDate(date.getDate() + 1)
    const day = date.getDay()
    if (day !== 0 && day !== 6) businessDays++
  }
  return date.toISOString()
}

type InputErrors = Record<string, string> | null

function validateConfirmarInput(input: ConfirmarCompraActionInput): InputErrors {
  const errors: Record<string, string> = {}
  if (input.copias.length === 0) errors.copias = "No hay copias seleccionadas."
  if (input.tarjetas.length === 0) errors.tarjetas = "No hay tarjetas seleccionadas."
  if (input.total <= 0) errors.total = "Total inválido."
  if (!TIPOS_ENTREGA_VALIDOS.includes(input.entrega.tipo as typeof TIPOS_ENTREGA_VALIDOS[number])) {
    errors.tipo = "TIPO_ENTREGA_INVALIDO"
  }
  if (!input.entrega.id_tienda_destino) errors.id_tienda_destino = "Tienda de destino no especificada."
  return Object.keys(errors).length > 0 ? errors : null
}

export async function confirmarCompraAction(
  input: ConfirmarCompraActionInput,
): Promise<ConfirmarCompraResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, errors: { general: "No hay sesión activa." } }

    const inputErrors = validateConfirmarInput(input)
    if (inputErrors) return { success: false, errors: inputErrors }

    const tipoEntrega = mapTipoEntrega(input.entrega.tipo)

    const direccionResult = await resolveDireccionDestino(user, tipoEntrega, input.entrega.id_tienda_destino)
    if (!direccionResult.ok) return { success: false, errors: direccionResult.errors }

    const serviceInput: RegistrarCompraInput = {
      id_usuario: user.id,
      subtotal: input.subtotal,
      total: input.total,
      id_promocion: null,
      copias: input.copias,
      tarjetas: input.tarjetas,
      entrega: {
        tipo: tipoEntrega,
        costo: input.entrega.costo,
        fecha_entrega_estimada: computeFechaEntregaEstimada(),
        id_direccion_destino: direccionResult.id_direccion,
      },
    }

    return await registrarCompra(serviceInput)
  } catch (error) {
    console.error("[confirmarCompraAction]", error)
    return { success: false, errors: { general: "Error inesperado al procesar la compra." } }
  }
}
