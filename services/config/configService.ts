import "server-only";

import { getErrorMessage } from "@/lib/services/errors";
import { requireRootRole } from "@/lib/validations/server-auth";
import { getAllConfigs, updateConfig } from "@/models/configModel";
import type { Json } from "@/lib/types/supabase";
import type { ActionResponse } from "@/lib/types/common";
import type { ConfigRow } from "@/lib/types/config";

export async function fetchAllConfigs(): Promise<{
  success: boolean;
  data?: ConfigRow[];
  errors?: Record<string, string>;
}> {
  const roleCheck = await requireRootRole();
  if (!roleCheck.success) {
    return { success: false, errors: { form: roleCheck.message ?? "No autorizado." } };
  }

  try {
    const data = await getAllConfigs();
    return { success: true, data };
  } catch (error) {
    console.error("[configService] Error obteniendo configs:", error);
    return { success: false, errors: { form: getErrorMessage(error) } };
  }
}

export async function updateConfigValue(
  clave: string,
  valor: Json,
): Promise<ActionResponse> {
  const roleCheck = await requireRootRole();
  if (!roleCheck.success) {
    return { success: false, message: roleCheck.message ?? "No autorizado." };
  }

  try {
    await updateConfig(clave, valor);
    return { success: true, message: "Configuración actualizada." };
  } catch (error) {
    console.error("[configService] Error actualizando config:", error);
    return { success: false, message: getErrorMessage(error) };
  }
}
