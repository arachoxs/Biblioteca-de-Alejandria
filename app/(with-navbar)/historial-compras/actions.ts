"use server";

import { obtenerHistorialCompras } from "@/services/compra/compraService";
import type { CompraListParams, CompraHistorialResponse } from "@/lib/types/compra";

export async function fetchHistorialComprasAction(
  params: CompraListParams
): Promise<CompraHistorialResponse> {
  try {
    return await obtenerHistorialCompras(params);
  } catch (error) {
    console.error("[historialComprasAction] Error:", error);
    return {
      data: [],
      total: 0,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: 0,
    };
  }
}
