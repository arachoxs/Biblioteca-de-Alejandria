import "server-only";

import { findUsuariosConCumpleanosHoy, create as createPromocion } from "@/models/promocionModel";
import { getPorcentajeCumpleanos } from "./promocionService";
import { sendEmail } from "@/lib/services/email";
import { cumpleanosHtmlTemplate } from "@/lib/templates/email-templates";

interface CumpleanosResult {
  procesados: number;
  creados: number;
  enviados: number;
  errores: number;
}

export async function generarPromocionesCumpleanos(): Promise<CumpleanosResult> {
  const usuarios = await findUsuariosConCumpleanosHoy();
  const porcentaje = await getPorcentajeCumpleanos();

  const now = new Date();
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23, 59, 59, 999,
  );

  let creados = 0;
  let enviados = 0;
  let errores = 0;

  for (const usuario of usuarios) {
    try {
      await createPromocion({
        nombre: "Cumpleaños",
        porcentaje_descuento: porcentaje,
        tipo: "cumpleanos",
        id_usuario: usuario.id,
        fecha_expiracion: endOfDay.toISOString(),
      });
      creados++;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("duplicate") || msg.includes("unique")) {
        creados++;
      } else {
        console.error(`[cumpleanosService] Error creando promoción para ${usuario.id}:`, error);
        errores++;
        continue;
      }
    }

    try {
      const nombreCompleto = `${usuario.nombres} ${usuario.apellidos}`.trim();
      const html = cumpleanosHtmlTemplate(nombreCompleto, porcentaje);
      await sendEmail({
        to: usuario.email,
        subject: "¡Feliz cumpleaños! — Biblioteca de Alejandría",
        html,
      });
      enviados++;
    } catch (error) {
      console.error(`[cumpleanosService] Error enviando correo a ${usuario.email}:`, error);
      errores++;
    }
  }

  return {
    procesados: usuarios.length,
    creados,
    enviados,
    errores,
  };
}
