import { createCompra } from "@/models/compraModel";
import { insertItemComprasBatch } from "@/models/itemCompraModel";
import { insertTarjetaComprasBatch } from "@/models/tarjetaCompraModel";
import { insertEntrega } from "@/models/entregaModel";
import { getCopiasByIds, updateCopiaEstadoIfBatch } from "@/models/copiaModel";
import { getTarjetaById, addBalance as addTarjetaBalance } from "@/models/tarjetaModel";
import { getActiveTiendaById } from "@/models/tiendaModel";
import { getUserProfileById } from "@/models/userModel";
import { createAdminClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/services/errors";

export interface RegistrarCompraInput {
  id_usuario: string;
  subtotal: number;
  total: number;
  id_promocion?: number | null;
  copias: { id_copia: string }[];
  tarjetas: { id_tarjeta: number; monto: number }[];
  entrega: {
    tipo: "envio" | "recogida";
    id_tienda_origen: string;
    id_direccion_destino?: number;
    costo: number;
    fecha_entrega_estimada: string;
  };
}

export interface RegistrarCompraResponse {
  success: boolean;
  compraId?: string;
  entregaId?: string;
  errors?: Record<string, string>;
}

interface CreatedResources {
  compraId?: string;
  itemCompraIds?: number[];
  tarjetaCompraIds?: number[];
  entregaId?: string;
  deducciones?: { id_tarjeta: number; monto: number }[];
}

function validateInput(input: RegistrarCompraInput): Record<string, string> | null {
  const errors: Record<string, string> = {};
  if (input.copias.length === 0) errors.general = "COPIAS_VACIO";
  if (input.tarjetas.length === 0) errors.general = (errors.general ? errors.general + "|" : "") + "TARJETAS_VACIO";
  if (input.total <= 0) errors.general = (errors.general ? errors.general + "|" : "") + "TOTAL_INVALIDO";
  return Object.keys(errors).length > 0 ? errors : null;
}

async function validateCopiasAvailability(
  copiaIds: string[],
  id_tienda_origen: string
): Promise<{ ok: true; copias: { id: string }[] } | { ok: false; errors: Record<string, string> }> {
  const copias = await getCopiasByIds(copiaIds);
  const noDisponibles = copias
    .filter((c) => c.estado !== "disponible" || c.id_tienda !== id_tienda_origen)
    .map((c) => c.id);

  if (noDisponibles.length > 0) {
    return {
      ok: false,
      errors: { copias: "COPIAS_NO_DISPONIBLES", copiaIds: noDisponibles.join(",") },
    };
  }
  return { ok: true, copias };
}

async function validateTarjetas(
  tarjetas: { id_tarjeta: number; monto: number }[],
  userId: string
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
  total: number
): { ok: true } | { ok: false; errors: Record<string, string> } {
  const sumMontos = tarjetas.reduce((sum, t) => sum + t.monto, 0);
  if (sumMontos !== total) {
    return { ok: false, errors: { total: "MONTO_TOTAL_MISMATCH" } };
  }
  return { ok: true };
}

function resolveDireccionDestino(
  entrega: RegistrarCompraInput["entrega"],
  tiendaIdDireccion: number,
  userProfileIdDireccion: number
): number {
  if (entrega.id_direccion_destino !== undefined) {
    return entrega.id_direccion_destino;
  }
  if (entrega.tipo === "envio") {
    return userProfileIdDireccion;
  }
  return tiendaIdDireccion;
}

async function restoreDeducciones(deducciones: { id_tarjeta: number; monto: number }[]): Promise<void> {
  for (const d of deducciones) {
    try {
      await addTarjetaBalance(d.id_tarjeta, d.monto);
    } catch {
      console.error(`[compraService] Error restaurando saldo tarjeta ${d.id_tarjeta}:`);
    }
  }
}

async function destroyDeducciones(deducciones: { id_tarjeta: number; monto: number }[]): Promise<void> {
  await restoreDeducciones(deducciones);
}

async function destroyRecursos(created: CreatedResources): Promise<void> {
  const adminClient = createAdminClient();
  if (created.entregaId) await adminClient.from("entrega").delete().eq("id", created.entregaId);
  if (created.tarjetaCompraIds?.length) await adminClient.from("tarjeta_compra").delete().in("id", created.tarjetaCompraIds);
  if (created.itemCompraIds?.length) await adminClient.from("item_compra").delete().in("id", created.itemCompraIds);
  if (created.compraId) await adminClient.from("compra").delete().eq("id", created.compraId);
}

async function cleanup(created: CreatedResources): Promise<void> {
  try {
    if (created.deducciones?.length) await destroyDeducciones(created.deducciones);
    await destroyRecursos(created);
  } catch (cleanupError) {
    console.error("[compraService] Error durante cleanup:", cleanupError);
  }
}

async function executeWrites(
  input: RegistrarCompraInput,
  tiendaIdDireccion: number,
  userProfileIdDireccion: number,
): Promise<{ compraId: string; entregaId: string; created: CreatedResources }> {
  const created: CreatedResources = {};

  const compra = await createCompra({
    fecha: new Date().toISOString(),
    id_usuario: input.id_usuario,
    subtotal: input.subtotal,
    total: input.total,
    id_promocion: input.id_promocion ?? null,
  });
  created.compraId = compra.id;

  const items = await insertItemComprasBatch(
    input.copias.map((c) => ({ id_compra: compra.id, id_copia: c.id_copia }))
  );
  created.itemCompraIds = items.map((i) => i.id);

  const tarjetaItems = await insertTarjetaComprasBatch(
    input.tarjetas.map((t) => ({ id_compra: compra.id, id_tarjeta: t.id_tarjeta, monto: t.monto }))
  );
  created.tarjetaCompraIds = tarjetaItems.map((t) => t.id);

  for (const t of input.tarjetas) {
    await addTarjetaBalance(t.id_tarjeta, -t.monto);
  }
  created.deducciones = input.tarjetas.map((t) => ({ id_tarjeta: t.id_tarjeta, monto: t.monto }));

  const id_direccion_destino = resolveDireccionDestino(
    input.entrega,
    tiendaIdDireccion,
    userProfileIdDireccion,
  );

  const entrega = await insertEntrega({
    id_compra: compra.id,
    tipo: input.entrega.tipo,
    costo: input.entrega.costo,
    fecha_entrega_estimada: input.entrega.fecha_entrega_estimada,
    id_direccion_origen: tiendaIdDireccion,
    id_direccion_destino,
  });
  created.entregaId = entrega.id;

  const copiaIds = input.copias.map((c) => c.id_copia);
  await updateCopiaEstadoIfBatch(copiaIds, "disponible", "vendido");

  return { compraId: compra.id, entregaId: entrega.id, created };
}

export async function registrarCompra(
  input: RegistrarCompraInput
): Promise<RegistrarCompraResponse> {
  const inputErrors = validateInput(input);
  if (inputErrors) {
    return { success: false, errors: inputErrors };
  }

  const copiaIds = input.copias.map((c) => c.id_copia);
  const copiaCheck = await validateCopiasAvailability(copiaIds, input.entrega.id_tienda_origen);
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

  const tienda = await getActiveTiendaById(input.entrega.id_tienda_origen);
  if (!tienda) {
    return { success: false, errors: { tienda: "TIENDA_NO_ENCONTRADA" } };
  }

  const userProfile = await getUserProfileById(input.id_usuario);
  if (!userProfile) {
    return { success: false, errors: { usuario: "USUARIO_NO_ENCONTRADO" } };
  }

  try {
    const { compraId, entregaId } = await executeWrites(
      input,
      tienda.id_direccion,
      userProfile.id_direccion,
    );
    return { success: true, compraId, entregaId };
  } catch (error) {
    console.error("[compraService] Error en registrarCompra:", error);
    return { success: false, errors: { general: getErrorMessage(error) } };
  }
}
