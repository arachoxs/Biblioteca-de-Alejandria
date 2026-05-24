"use server"

import {
  calcularOpcionesEnvio,
  ejecutarTraslados,
} from "@/services/checkout/checkoutEnvioService"
import { getCurrentUser } from "@/models/authModel"
import { getUserPlaceId, getUserFullAddress } from "@/models/checkoutModel"
import type { ResultadoEnvio } from "@/lib/types/checkout"

export async function calcularEnvioAction(
  userPlaceId?: string,
): Promise<ResultadoEnvio> {
  try {
    return await calcularOpcionesEnvio(userPlaceId)
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
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Error al realizar el traslado.",
    }
  }
}
