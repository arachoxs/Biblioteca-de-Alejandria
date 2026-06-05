import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/services/errors";
import { limpiarPromocionesExpiradas } from "@/services/promocion/promocionService";

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await limpiarPromocionesExpiradas();
    return NextResponse.json({
      success: result.success,
      message: result.message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[cron/limpiar-promociones-expiradas] Error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
