"use server";

import {
  obtenerHistorialCompras,
  obtenerDetalleCompra,
  obtenerDetalleExtra,
} from "@/services/compra/compraService";
import {
  obtenerItemsElegiblesParaDevolucion,
  solicitarDevolucion,
  obtenerHistorialDevoluciones,
} from "@/services/devolucion/devolucionService";
import type {
  CompraListParams,
  CompraHistorialResponse,
  CompraConItems,
  CompraDetalleExtra,
} from "@/lib/types/compra";
import type {
  ItemDevolucionElegible,
  SolicitarDevolucionResponse,
  DevolucionConItems,
  MotivoDevolucion,
} from "@/lib/types/devolucion";

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

export async function fetchItemsElegiblesDevolucionAction(
  idCompra: string
): Promise<ItemDevolucionElegible[] | null> {
  try {
    return await obtenerItemsElegiblesParaDevolucion(idCompra);
  } catch (error) {
    console.error("[historialComprasAction] Error fetching items elegibles:", error);
    return null;
  }
}

export async function solicitarDevolucionAction(
  idCompra: string,
  items: {
    id_copia: string;
    motivo: MotivoDevolucion;
    descripcion_motivo?: string;
  }[]
): Promise<SolicitarDevolucionResponse> {
  try {
    return await solicitarDevolucion(idCompra, items);
  } catch (error) {
    console.error("[historialComprasAction] Error en solicitarDevolucion:", error);
    return { success: false, errors: { general: "Error inesperado" } };
  }
}

export async function fetchHistorialDevolucionesAction(): Promise<
  DevolucionConItems[]
> {
  try {
    return await obtenerHistorialDevoluciones();
  } catch (error) {
    console.error("[historialComprasAction] Error fetching historial devoluciones:", error);
    return [];
  }
}
