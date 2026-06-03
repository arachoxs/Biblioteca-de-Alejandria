import {
  createCompra,
  getComprasByUserId,
  getCompraById,
  getCompraDetalleById,
  getCompraDetalleExtraById,
} from "@/models/compraModel";
import { insertItemComprasBatch } from "@/models/itemCompraModel";
import { insertTarjetaComprasBatch } from "@/models/tarjetaCompraModel";
import { insertEntrega } from "@/models/entregaModel";
import { getCopiasByIds, updateCopiaEstadoIfBatch } from "@/models/copiaModel";
import {
  countReservasActivasByUser,
  deleteReservasByUserAndCopias,
} from "@/models/reservaModel";
import {
  getTarjetaById,
  addBalance as addTarjetaBalance,
} from "@/models/tarjetaModel";
import { getCurrentUser } from "@/models/authModel";
import { createAdminClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/services/errors";
import type {
  CompraListParams,
  CompraHistorialResponse,
  CompraConItems,
  CompraDetalleExtra,
} from "@/lib/types/compra";

export interface RegistrarCompraInput {
  id_usuario: string;
  subtotal: number;
  total: number;
  id_promocion?: number | null;
  copias: { id_copia: string }[];
  tarjetas: { id_tarjeta: number; monto: number }[];
  entrega: {
    tipo: "envio" | "recogida";
    costo: number;
    fecha_entrega_estimada: string;
    id_direccion_destino: number;
  };
}

export interface RegistrarCompraResponse {
  success: boolean;
  compraId?: string;
  entregaId?: string;
  fechaEntregaEstimada?: string;
  errors?: Record<string, string>;
}

interface CreatedResources {
  compraId?: string;
  itemCompraIds?: number[];
  tarjetaCompraIds?: number[];
  entregaId?: string;
  deducciones?: { id_tarjeta: number; monto: number }[];
  copiaIds?: string[];
  userId?: string;
}

async function validateCopiasAvailability(
  copiaIds: string[],
  userId: string,
): Promise<
  | { ok: true; copias: { id: string }[] }
  | { ok: false; errors: Record<string, string> }
> {
  const copias = await getCopiasByIds(copiaIds);

  const noDisponibles = copias
    .filter((c) => c.estado !== "reservado")
    .map((c) => c.id);

  if (noDisponibles.length > 0) {
    return {
      ok: false,
      errors: {
        copias: "COPIAS_NO_DISPONIBLES",
        copiaIds: noDisponibles.join(","),
      },
    };
  }

  const reservasCount = await countReservasActivasByUser({ userId, copiaIds });
  if (reservasCount !== copiaIds.length) {
    return {
      ok: false,
      errors: { copias: "COPIAS_NO_PERTENECEN_USUARIO" },
    };
  }

  return { ok: true, copias };
}

async function validateTarjetas(
  tarjetas: { id_tarjeta: number; monto: number }[],
  userId: string,
): Promise<{ ok: true } | { ok: false; errors: Record<string, string> }> {
  const errors: Record<string, string> = {};
  for (const t of tarjetas) {
    const tarjeta = await getTarjetaById(t.id_tarjeta);
    if (!tarjeta) {
      errors[`tarjeta_${t.id_tarjeta}`] = "TARJETA_NO_ENCONTRADA";
      continue;
    }
    if (tarjeta.id_usuario !== userId) {
      errors[`tarjeta_${t.id_tarjeta}`] = "TARJETA_NO_PERTENECE";
      continue;
    }
    if (tarjeta.saldo < t.monto) {
      errors[`tarjeta_${t.id_tarjeta}`] = "TARJETA_SALDO_INSUFICIENTE";
    }
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true };
}

function validateMontoTotal(
  tarjetas: { id_tarjeta: number; monto: number }[],
  total: number,
): { ok: true } | { ok: false; errors: Record<string, string> } {
  const sumMontos = tarjetas.reduce((sum, t) => sum + t.monto, 0);
  if (sumMontos !== total) {
    return { ok: false, errors: { total: "MONTO_TOTAL_MISMATCH" } };
  }
  return { ok: true };
}

async function restoreDeducciones(
  deducciones: { id_tarjeta: number; monto: number }[],
): Promise<void> {
  for (const d of deducciones) {
    try {
      await addTarjetaBalance(d.id_tarjeta, d.monto);
    } catch {
      console.error(
        `[compraService] Error restaurando saldo tarjeta ${d.id_tarjeta}:`,
      );
    }
  }
}

async function destroyDeducciones(
  deducciones: { id_tarjeta: number; monto: number }[],
): Promise<void> {
  await restoreDeducciones(deducciones);
}

async function destroyRecursos(created: CreatedResources): Promise<void> {
  const adminClient = createAdminClient();
  if (created.entregaId)
    await adminClient.from("entrega").delete().eq("id", created.entregaId);
  if (created.tarjetaCompraIds?.length)
    await adminClient
      .from("tarjeta_compra")
      .delete()
      .in("id", created.tarjetaCompraIds);
  if (created.itemCompraIds?.length)
    await adminClient
      .from("item_compra")
      .delete()
      .in("id", created.itemCompraIds);
  if (created.compraId)
    await adminClient.from("compra").delete().eq("id", created.compraId);
}

async function cleanup(created: CreatedResources): Promise<void> {
  try {
    if (created.deducciones?.length)
      await destroyDeducciones(created.deducciones);
    if (created.copiaIds?.length) {
      await updateCopiaEstadoIfBatch(created.copiaIds, "vendido", "reservado");
    }
    await destroyRecursos(created);
  } catch (cleanupError) {
    console.error("[compraService] Error durante cleanup:", cleanupError);
  }
}

async function executeWrites(
  input: RegistrarCompraInput,
): Promise<{ compraId: string; entregaId: string }> {
  const created: CreatedResources = {};

  try {
    const compra = await createCompra({
      fecha: new Date().toISOString(),
      id_usuario: input.id_usuario,
      subtotal: input.subtotal,
      total: input.total,
      id_promocion: input.id_promocion ?? null,
    });
    created.compraId = compra.id;

    const items = await insertItemComprasBatch(
      input.copias.map((c) => ({ id_compra: compra.id, id_copia: c.id_copia })),
    );
    created.itemCompraIds = items.map((i) => i.id);

    const tarjetaItems = await insertTarjetaComprasBatch(
      input.tarjetas.map((t) => ({
        id_compra: compra.id,
        id_tarjeta: t.id_tarjeta,
        monto: t.monto,
      })),
    );
    created.tarjetaCompraIds = tarjetaItems.map((t) => t.id);

    for (const t of input.tarjetas) {
      await addTarjetaBalance(t.id_tarjeta, -t.monto);
    }
    created.deducciones = input.tarjetas.map((t) => ({
      id_tarjeta: t.id_tarjeta,
      monto: t.monto,
    }));

    const entrega = await insertEntrega({
      id_compra: compra.id,
      tipo: input.entrega.tipo,
      costo: input.entrega.costo,
      fecha_entrega_estimada: input.entrega.fecha_entrega_estimada,
      id_direccion_destino: input.entrega.id_direccion_destino,
    });
    created.entregaId = entrega.id;

    const copiaIds = input.copias.map((c) => c.id_copia);
    created.copiaIds = copiaIds;
    created.userId = input.id_usuario;

    await updateCopiaEstadoIfBatch(copiaIds, "reservado", "vendido");
    await deleteReservasByUserAndCopias(input.id_usuario, copiaIds);

    return { compraId: compra.id, entregaId: entrega.id };
  } catch (error) {
    await cleanup(created);
    throw error;
  }
}

export async function registrarCompra(
  input: RegistrarCompraInput,
): Promise<RegistrarCompraResponse> {
  const copiaIds = input.copias.map((c) => c.id_copia);

  const copiaCheck = await validateCopiasAvailability(
    copiaIds,
    input.id_usuario,
  );
  if (!copiaCheck.ok) {
    return { success: false, errors: copiaCheck.errors };
  }

  const tarjetaCheck = await validateTarjetas(input.tarjetas, input.id_usuario);
  if (!tarjetaCheck.ok) {
    return { success: false, errors: tarjetaCheck.errors };
  }

  const montoCheck = validateMontoTotal(input.tarjetas, input.total);
  if (!montoCheck.ok) {
    return { success: false, errors: montoCheck.errors };
  }

  try {
    const { compraId, entregaId } = await executeWrites(input);
    return {
      success: true,
      compraId,
      entregaId,
      fechaEntregaEstimada: input.entrega.fecha_entrega_estimada,
    };
  } catch (error) {
    console.error("[compraService] Error en registrarCompra:", error);
    return { success: false, errors: { general: getErrorMessage(error) } };
  }
}

// ─── Lectura ───────────────────────────────────────────────────────

async function verificarOwnershipCompra(
  idCompra: string,
): Promise<{ userId: string } | null> {
  const user = await getCurrentUser();
  if (!user) {
    console.error("[compraService] No hay sesión activa.");
    return null;
  }

  const raw = await getCompraById(idCompra);
  if (!raw || raw.id_usuario !== user.id) {
    console.error(
      "[compraService] La compra no pertenece al usuario autenticado.",
    );
    return null;
  }

  return { userId: user.id };
}

/**
 * Obtiene el historial de compras del usuario autenticado de forma paginada.
 * Filtra por userId de la sesión activa, con soporte de rango de fechas.
 */
export async function obtenerHistorialCompras(
  params: CompraListParams,
): Promise<CompraHistorialResponse> {
  const emptyResult: CompraHistorialResponse = {
    data: [],
    total: 0,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: 0,
  };

  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error("[compraService] No hay sesión activa.");
      return emptyResult;
    }

    return await getComprasByUserId(user.id, params);
  } catch (error) {
    console.error(
      "[compraService] Error obteniendo historial de compras:",
      error,
    );
    return emptyResult;
  }
}

async function ejecutarConOwnership<T>(
  idCompra: string,
  fn: () => Promise<T>,
  label: string,
): Promise<T | null> {
  try {
    const ownership = await verificarOwnershipCompra(idCompra);
    if (!ownership) return null;
    return await fn();
  } catch (error) {
    console.error(`[compraService] Error ${label}:`, error);
    return null;
  }
}

/**
 * Obtiene el detalle de una compra específica (compra + items enriquecidos).
 * Verifica que la compra pertenezca al usuario autenticado.
 * Retorna null si no hay sesión, la compra no existe o no pertenece al usuario.
 */
export function obtenerDetalleCompra(
  idCompra: string,
): Promise<CompraConItems | null> {
  return ejecutarConOwnership(
    idCompra,
    () => getCompraDetalleById(idCompra),
    "obteniendo detalle de compra",
  );
}

/**
 * Obtiene los datos extra de una compra: tarjetas de pago y estado de entrega.
 * Verifica que la compra pertenezca al usuario autenticado.
 * Retorna null si no hay sesión o la compra no pertenece al usuario.
 */
export function obtenerDetalleExtra(
  idCompra: string,
): Promise<CompraDetalleExtra | null> {
  return ejecutarConOwnership(
    idCompra,
    () => getCompraDetalleExtraById(idCompra),
    "obteniendo detalle extra de compra",
  );
}
