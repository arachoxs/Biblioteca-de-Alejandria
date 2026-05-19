import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/services/errors";
import { cleanExpiredReservas } from "@/services/reservas/reservaService";

/**
 * Endpoint para Vercel Cron Jobs.
 * Libera las reservas expiradas (fecha_expiracion < now()).
 *
 * Seguridad: verifica header Authorization contra CRON_SECRET.
 *
 * Configurar en vercel.json:
 *   crons: [{ path: "/api/cron/expirar-reservas", schedule: "every 5 minutes" }]
 */
export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await cleanExpiredReservas();
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message ?? "Error desconocido" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message ?? "Reservas expiradas procesadas.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[cron/expirar-reservas] Error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
