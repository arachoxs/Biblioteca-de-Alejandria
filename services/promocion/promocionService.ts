import "server-only";

import { getErrorMessage } from "@/lib/services/errors";
import { getConfig } from "@/models/configModel";
import {
  findActiveByUser,
  markAsUsed,
  unmarkAsUsed,
  deleteExpired,
} from "@/models/promocionModel";
import type { ActionResponse } from "@/lib/types/common";
import type { PromocionActiva } from "@/lib/types/promocion";

const CONFIG_KEY = "promocion_cumpleanos_porcentaje";
const DEFAULT_PORCENTAJE = 15;

export async function getPromocionActiva(
  userId: string,
): Promise<PromocionActiva | null> {
  try {
    return await findActiveByUser(userId);
  } catch (error) {
    console.error("[promocionService] Error buscando promoción activa:", error);
    return null;
  }
}

export async function aplicarPromocion(
  userId: string,
): Promise<{ promocionId: number | null; porcentaje: number }> {
  const promocion = await findActiveByUser(userId);
  if (!promocion) {
    return { promocionId: null, porcentaje: 0 };
  }

  await markAsUsed(promocion.id);
  return {
    promocionId: promocion.id,
    porcentaje: promocion.porcentaje_descuento,
  };
}

export async function revertirPromocion(promocionId: number): Promise<void> {
  await unmarkAsUsed(promocionId);
}

export async function getPorcentajeCumpleanos(): Promise<number> {
  try {
    const config = await getConfig(CONFIG_KEY);
    if (!config) return DEFAULT_PORCENTAJE;

    const valor = config.valor;
    const num = typeof valor === "string" ? parseInt(valor, 10) : Number(valor);
    return Number.isFinite(num) && num > 0 && num <= 100
      ? num
      : DEFAULT_PORCENTAJE;
  } catch (error) {
    console.error("[promocionService] Error leyendo porcentaje:", error);
    return DEFAULT_PORCENTAJE;
  }
}

export async function limpiarPromocionesExpiradas(): Promise<ActionResponse> {
  try {
    const eliminadas = await deleteExpired();
    return {
      success: true,
      message: `${eliminadas} promociones expiradas eliminadas.`,
    };
  } catch (error) {
    console.error("[promocionService] Error limpiando promociones:", error);
    return { success: false, message: getErrorMessage(error) };
  }
}
