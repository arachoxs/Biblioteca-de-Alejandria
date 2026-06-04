import { getCurrentUser } from "@/models/authModel";
import { getCompraById } from "@/models/compraModel";
import { getItemComprasByCompraId } from "@/models/itemCompraModel";
import {
  createDevolucion,
  getDevolucionByToken,
  getDevolucionesByUserId,
} from "@/models/devolucionModel";
import {
  insertItemDevolucionBatch,
  getItemsByDevolucionId,
  getDevueltosCopiaIdsByUsuario,
} from "@/models/itemDevolucionModel";
import { getCompraDetalleExtraById } from "@/models/compraModel";
import { getCopiasWithLibroByIds } from "@/models/copiaModel";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/services/email";
import { devolucionConfirmadaHtmlTemplate } from "@/lib/templates/email-templates";
import { getErrorMessage } from "@/lib/services/errors";
import type {
  ItemDevolucionElegible,
  SolicitarDevolucionResponse,
  DevolucionConItems,
  DevolucionItemDetalle,
} from "@/lib/types/devolucion";
import type { MotivoDevolucion } from "@/lib/types/devolucion";

const DIAS_MAX_DEVOLUCION = 8;

// ─── Helpers ──────────────────────────────────────────────────────

function verificarPlazoDevolucion(
  fechaEntregado: string | null,
): boolean {
  if (!fechaEntregado) return false;

  const entrega = new Date(fechaEntregado);
  const ahora = new Date();
  const diffMs = ahora.getTime() - entrega.getTime();
  const diffDias = diffMs / (1000 * 60 * 60 * 24);

  return diffDias <= DIAS_MAX_DEVOLUCION;
}

async function verificarOwnership(
  idCompra: string,
): Promise<{ userId: string; email: string } | null> {
  const user = await getCurrentUser();
  if (!user?.email) {
    console.error("[devolucionService] No hay sesión activa.");
    return null;
  }

  const compra = await getCompraById(idCompra);
  if (!compra || compra.id_usuario !== user.id) {
    console.error(
      "[devolucionService] La compra no pertenece al usuario autenticado.",
    );
    return null;
  }

  return { userId: user.id, email: user.email };
}

// ─── Obtener items elegibles para devolución ─────────────────────

export async function obtenerItemsElegiblesParaDevolucion(
  idCompra: string,
): Promise<ItemDevolucionElegible[] | null> {
  try {
    const ownership = await verificarOwnership(idCompra);
    if (!ownership) return null;

    const extra = await getCompraDetalleExtraById(idCompra);
    if (!extra.entrega) {
      console.error("[devolucionService] La compra no tiene entrega asociada.");
      return null;
    }

    if (extra.entrega.estado !== "entregado") {
      console.error("[devolucionService] La compra no ha sido entregada.");
      return null;
    }

    if (!verificarPlazoDevolucion(extra.entrega.fecha_entregado)) {
      console.error("[devolucionService] Plazo de devolución vencido.");
      return null;
    }

    const itemsCompra = await getItemComprasByCompraId(idCompra);
    const copiasDevueltas = await getDevueltosCopiaIdsByUsuario(
      ownership.userId,
    );
    const copiasDevueltasSet = new Set(copiasDevueltas);

    const copiaIds = itemsCompra.map((i) => i.id_copia);
    const copiasInfo = await getCopiasWithLibroByIds(copiaIds);

    const elegibles: ItemDevolucionElegible[] = itemsCompra.map((item) => {
      const info = copiasInfo.get(item.id_copia);
      return {
        id_item_compra: item.id,
        id_copia: item.id_copia,
        libro: info?.libro ?? null,
        imagen_portada: info?.imagen_portada ?? null,
        precio_unitario: item.monto,
        ya_devuelto: copiasDevueltasSet.has(item.id_copia),
      };
    });

    return elegibles;
  } catch (error) {
    console.error(
      "[devolucionService] Error obteniendo items elegibles:",
      error,
    );
    return null;
  }
}

// ─── Solicitar devolución ─────────────────────────────────────────

export async function solicitarDevolucion(
  idCompra: string,
  items: {
    id_copia: string;
    motivo: MotivoDevolucion;
    descripcion_motivo?: string;
  }[],
): Promise<SolicitarDevolucionResponse> {
  try {
    if (items.length === 0) {
      return { success: false, errors: { items: "SIN_ITEMS" } };
    }

    const ownership = await verificarOwnership(idCompra);
    if (!ownership) {
      return { success: false, errors: { general: "NO_AUTORIZADO" } };
    }

    const extra = await getCompraDetalleExtraById(idCompra);
    if (!extra.entrega || extra.entrega.estado !== "entregado") {
      return { success: false, errors: { general: "COMPRA_NO_ENTREGADA" } };
    }

    if (!verificarPlazoDevolucion(extra.entrega.fecha_entregado)) {
      return { success: false, errors: { general: "PLAZO_VENCIDO" } };
    }

    const itemsCompra = await getItemComprasByCompraId(idCompra);
    const copiasDeCompra = new Set(itemsCompra.map((i) => i.id_copia));

    for (const item of items) {
      if (!copiasDeCompra.has(item.id_copia)) {
        return {
          success: false,
          errors: { items: "ITEM_NO_PERTENECE", detalle: item.id_copia },
        };
      }
    }

    const copiasDevueltas = await getDevueltosCopiaIdsByUsuario(
      ownership.userId,
    );
    const copiasDevueltasSet = new Set(copiasDevueltas);

    for (const item of items) {
      if (copiasDevueltasSet.has(item.id_copia)) {
        return {
          success: false,
          errors: { items: "ITEM_YA_DEVUELTO", detalle: item.id_copia },
        };
      }
    }

    const devolucion = await createDevolucion(ownership.userId);

    await insertItemDevolucionBatch(
      items.map((item) => ({
        id_devolucion: devolucion.id,
        id_copia: item.id_copia,
        motivo: item.motivo,
        descripcion_motivo: item.descripcion_motivo,
      })),
    );

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const detalleUrl = `${baseUrl}/devoluciones/${devolucion.token}`;

    const copiaIds = items.map((i) => i.id_copia);
    const copiasInfo = await getCopiasWithLibroByIds(copiaIds);

    const QRCode = await import("qrcode");
    const qrBuffer = await QRCode.toBuffer(detalleUrl, {
      width: 300,
      margin: 2,
      color: { dark: "#49111c", light: "#ffffff" },
    });

    let qrPublicUrl = "";
    try {
      const adminClient = createAdminClient();
      const qrPath = `devoluciones/${devolucion.id}/qr.png`;

      const { error: uploadError } = await adminClient.storage
        .from("qr-devoluciones")
        .upload(qrPath, qrBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        console.error(
          "[devolucionService] Error subiendo QR a storage:",
          uploadError,
        );
      } else {
        const { data: signedData } = await adminClient.storage
          .from("qr-devoluciones")
          .createSignedUrl(qrPath, 60 * 60 * 24 * 30);

        qrPublicUrl = signedData?.signedUrl ?? "";
      }
    } catch (storageErr) {
      console.error(
        "[devolucionService] Error con storage de QR:",
        storageErr,
      );
    }

    const emailHtml = devolucionConfirmadaHtmlTemplate(
      devolucion.id,
      qrPublicUrl,
      items.map((item) => {
        const info = copiasInfo.get(item.id_copia);
        return {
          titulo: info?.libro?.titulo ?? "Libro",
          motivo: item.motivo,
        };
      }),
      detalleUrl,
    );

    sendEmail({
      to: ownership.email,
      subject: `Devolución #${devolucion.id} registrada — Biblioteca de Alejandría`,
      html: emailHtml,
    }).catch((err) => {
      console.error(
        "[devolucionService] Error enviando email de devolución:",
        err,
      );
    });

    return { success: true, devolucionId: devolucion.id };
  } catch (error) {
    console.error("[devolucionService] Error en solicitarDevolucion:", error);
    return {
      success: false,
      errors: { general: getErrorMessage(error) },
    };
  }
}

// ─── Obtener devolución por token ─────────────────────────────────

export async function obtenerDevolucionPorToken(
  token: string,
): Promise<DevolucionConItems | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const devolucion = await getDevolucionByToken(token);
    if (!devolucion || devolucion.id_usuario !== user.id) return null;

    const itemsRaw = await getItemsByDevolucionId(devolucion.id);

    const copiaIds = itemsRaw
      .map((i) => i.id_copia)
      .filter((id): id is string => id !== null);
    const copiasInfo = await getCopiasWithLibroByIds(copiaIds);

    const items: DevolucionItemDetalle[] = itemsRaw.map((item) => {
      const info = item.id_copia ? copiasInfo.get(item.id_copia) : undefined;
      return {
        id: item.id,
        id_copia: item.id_copia ?? "",
        motivo: item.motivo,
        descripcion_motivo: item.descripcion_motivo,
        libro: info?.libro ?? null,
        imagen_portada: info?.imagen_portada ?? null,
      };
    });

    return {
      id: devolucion.id,
      fecha: devolucion.fecha,
      estado: devolucion.estado,
      token: devolucion.token,
      items,
    };
  } catch (error) {
    console.error(
      "[devolucionService] Error obteniendo devolución por token:",
      error,
    );
    return null;
  }
}

// ─── Historial de devoluciones del usuario ────────────────────────

export async function obtenerHistorialDevoluciones(): Promise<
  DevolucionConItems[]
> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const devoluciones = await getDevolucionesByUserId(user.id);

    const resultados: DevolucionConItems[] = [];

    for (const dev of devoluciones) {
      const itemsRaw = await getItemsByDevolucionId(dev.id);

      const copiaIds = itemsRaw
        .map((i) => i.id_copia)
        .filter((id): id is string => id !== null);
      const copiasInfo = await getCopiasWithLibroByIds(copiaIds);

      const items: DevolucionItemDetalle[] = itemsRaw.map((item) => {
        const info = item.id_copia ? copiasInfo.get(item.id_copia) : undefined;
        return {
          id: item.id,
          id_copia: item.id_copia ?? "",
          motivo: item.motivo,
          descripcion_motivo: item.descripcion_motivo,
          libro: info?.libro ?? null,
          imagen_portada: info?.imagen_portada ?? null,
        };
      });

      resultados.push({
        id: dev.id,
        fecha: dev.fecha,
        estado: dev.estado,
        token: dev.token,
        items,
      });
    }

    return resultados;
  } catch (error) {
    console.error(
      "[devolucionService] Error obteniendo historial de devoluciones:",
      error,
    );
    return [];
  }
}
