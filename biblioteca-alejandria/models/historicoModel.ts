import { createAdminClient } from "@/lib/supabase/server";
import type { ModelResult, Paginated } from "@/lib/types/common";
import type {
  HistoricoRow,
  InsertHistoricoPayload,
} from "@/lib/types/historico";
import { MAX_PAGE_SIZE } from "@/lib/validations/rules";

// ─── Escritura ─────────────────────────────────────────────────────

export async function insertHistorico(
  data: InsertHistoricoPayload
): Promise<ModelResult> {
  const adminClient = createAdminClient();

  const { error } = await adminClient.from("historico").insert({
    id_libro: data.id_libro,
    estado: data.estado,
    fecha: data.fecha,
  });

  if (error) {
    console.error("[historicoModel] Error insertando histórico:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteHistoricoByLibroId(id_libro: string): Promise<ModelResult> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("historico")
    .delete()
    .eq("id_libro", id_libro);

  if (error) {
    console.error("[historicoModel] Error eliminando histórico por id_libro:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Lectura ───────────────────────────────────────────────────────

export async function getHistoricoByLibro(
  id_libro: string,
  page: number = 1,
  pageSize: number = 10
): Promise<Paginated<HistoricoRow>> {
  const adminClient = createAdminClient();

  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  const { data, error, count } = await adminClient
    .from("historico")
    .select("*", { count: "exact" })
    .eq("id_libro", id_libro)
    .range(from, to)
    .order("fecha", { ascending: false });

  if (error) {
    console.error("[historicoModel] Error listando logs histórico por libro:", error);
    throw error;
  }

  const totalCount = count || 0;

  return {
    data: data || [],
    total: totalCount,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(totalCount / safePageSize),
  };
}