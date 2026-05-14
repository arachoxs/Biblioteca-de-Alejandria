import { createAdminClient } from "@/lib/supabase/server";

export type PreferenceTarget = "autor" | "categoria";
export type SoftDeleteFilter = "active" | "all";

const TABLE_NAMES: Record<PreferenceTarget, "preferencia_autor" | "preferencia_categoria"> = {
  autor: "preferencia_autor",
  categoria: "preferencia_categoria",
};

const TARGET_ID_FIELD: Record<PreferenceTarget, "id_autor" | "id_categoria"> = {
  autor: "id_autor",
  categoria: "id_categoria",
};

const ERROR_PREFIX = "[preferenceQueryBuilder]";

export async function findPreferenceId(
  target: PreferenceTarget,
  id_usuario: string,
  targetId: number,
  softDeleteFilter: SoftDeleteFilter
): Promise<number | null> {
  const adminClient = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = adminClient
    .from(TABLE_NAMES[target])
    .select("id")
    .eq("id_usuario", id_usuario)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .eq(TARGET_ID_FIELD[target] as any, targetId)
    .limit(1)
    .maybeSingle();

  if (softDeleteFilter === "active") {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error(
      `${ERROR_PREFIX} Error al buscar preferencia de ${target}:`,
      error
    );
    throw error;
  }

  return data?.id ?? null;
}