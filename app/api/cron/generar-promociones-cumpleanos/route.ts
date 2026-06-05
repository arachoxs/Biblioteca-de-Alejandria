import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/services/errors";
import { generarPromocionesCumpleanos } from "@/services/promocion/cumpleanosService";

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await generarPromocionesCumpleanos();
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[cron/generar-promociones-cumpleanos] Error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
