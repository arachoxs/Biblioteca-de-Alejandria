"use server";

import { fetchAllConfigs, updateConfigValue } from "@/services/config/configService";
import type { ActionResponse } from "@/lib/types/common";
import type { ConfigRow } from "@/lib/types/config";

function isValidPorcentaje(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor) && valor > 0 && valor <= 100;
}

export async function getConfigsAction(): Promise<{
  success: boolean;
  data?: ConfigRow[];
  errors?: Record<string, string>;
}> {
  return await fetchAllConfigs();
}

export async function updateConfigAction(
  clave: string,
  valor: number,
): Promise<ActionResponse> {
  if (!isValidPorcentaje(valor)) {
    return {
      success: false,
      errors: { valor: "El valor debe ser un número entre 1 y 100." },
    };
  }

  return await updateConfigValue(clave, valor);
}
