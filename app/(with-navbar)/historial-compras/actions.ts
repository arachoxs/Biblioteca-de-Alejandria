"use server";

import {
  obtenerHistorialCompras,
  obtenerDetalleCompra,
  obtenerDetalleExtra,
} from "@/services/compra/compraService";
import type {
  CompraListParams,
  CompraHistorialResponse,
  CompraConItems,
  CompraDetalleExtra,
} from "@/lib/types/compra";

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

export async function fetchCompraDetalleAction(
  idCompra: string
): Promise<CompraConItems | null> {
  try {
    return await obtenerDetalleCompra(idCompra);
  } catch (error) {
    console.error("[historialComprasAction] Error fetching compra detail:", error);
    return null;
  }
}

export async function fetchCompraDetalleExtraAction(
  idCompra: string
): Promise<CompraDetalleExtra | null> {
  try {
    return await obtenerDetalleExtra(idCompra);
  } catch (error) {
    console.error("[historialComprasAction] Error fetching compra extra:", error);
    return null;
  }
}
