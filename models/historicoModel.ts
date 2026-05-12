import { createAdminClient } from "@/lib/supabase/server";
import type { Paginated } from "@/lib/types/common";
import type { CopiaRow } from "@/lib/types/copia";
import type {
  HistoricoSyncBookSnapshot,
  HistoricoRow,
  InsertHistoricoPayload,
} from "@/lib/types/historico";
import { MAX_PAGE_SIZE } from "@/lib/validations/rules";

// ─── Escritura ─────────────────────────────────────────────────────

export async function insertHistorico(
  data: InsertHistoricoPayload
): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient.from("historico").insert({
    id_libro: data.id_libro,
    estado: data.estado,
    fecha: data.fecha,
  });

  if (error) {
    console.error("[historicoModel] Error insertando histórico:", error);
    throw error;
  }
}

export async function insertHistoricoBatch(
  data: InsertHistoricoPayload[],
): Promise<void> {
  if (data.length === 0) {
    return;
  }

  const adminClient = createAdminClient();

  const payload = data.map((item) => ({
    id_libro: item.id_libro,
    estado: item.estado,
    fecha: item.fecha,
  }));

  const { error } = await adminClient.from("historico").insert(payload);

  if (error) {
    console.error("[historicoModel] Error insertando históricos en lote:", error);
    throw error;
  }
}

export async function deleteHistoricoByLibroId(id_libro: string): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("historico")
    .delete()
    .eq("id_libro", id_libro);

  if (error) {
    console.error("[historicoModel] Error eliminando histórico por id_libro:", error);
    throw error;
  }
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

export async function getLatestHistoricoByLibro(
  id_libro: string,
): Promise<HistoricoRow | null> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("historico")
    .select("*")
    .eq("id_libro", id_libro)
    .order("fecha", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[historicoModel] Error obteniendo último histórico por libro:", error);
    throw error;
  }

  return data;
}

type LibroHistoricoSyncRow = {
  id: string;
  copia: Pick<CopiaRow, "estado" | "deleted_at">[] | null;
  historico:
    | Pick<HistoricoRow, "id" | "estado" | "fecha">[]
    | null;
};

export async function getHistoricoSyncSnapshotsByLibros(
  libroIds: string[],
): Promise<HistoricoSyncBookSnapshot[]> {
  if (libroIds.length === 0) {
    return [];
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("libro")
    .select(`
      id,
      copia!left(estado, deleted_at),
      historico!left(id, estado, fecha)
    `)
    .in("id", libroIds)
    .order("fecha", { foreignTable: "historico", ascending: false })
    .order("id", { foreignTable: "historico", ascending: false })
    .limit(1, { foreignTable: "historico" });

  if (error) {
    console.error(
      "[historicoModel] Error obteniendo snapshots de sincronización de histórico:",
      error,
    );
    throw error;
  }

  const rows = (data ?? []) as LibroHistoricoSyncRow[];

  return rows.map((row) => ({
    id_libro: row.id,
    available_count:
      row.copia?.filter(
        (copy) => copy.deleted_at === null && copy.estado === "disponible",
      ).length ?? 0,
    latest_estado: row.historico?.[0]?.estado ?? null,
  }));
}

export async function listHistoricoByLibro(
  id_libro: string,
): Promise<HistoricoRow[]> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("historico")
    .select("*")
    .eq("id_libro", id_libro)
    .order("fecha", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error("[historicoModel] Error listando histórico completo por libro:", error);
    throw error;
  }

  return data ?? [];
}
