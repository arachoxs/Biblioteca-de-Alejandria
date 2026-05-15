import type { Database } from "@/lib/types/supabase";
import type { CategoryRow } from "./category";
import type { PreferenceActionResponse, PreferenceDataResponse } from "./preferencia";

export type CategoryPreferenceRow =
  Database["public"]["Tables"]["preferencia_categoria"]["Row"];

export interface AddCategoryPreferenceInput {
  id_categoria: number;
}

export interface InsertCategoryPreferencePayload {
  id_usuario: string;
  id_categoria: number;
}

export type CategoryPreferenceCategorySummary = Pick<CategoryRow, "id" | "nombre">;

export interface CategoryPreferenceWithDetails extends CategoryPreferenceRow {
  categoria: CategoryPreferenceCategorySummary | null;
}

export type CategoryPreferenceActionResponse = PreferenceActionResponse;

export type CategoryPreferenceDataResponse = PreferenceDataResponse<CategoryPreferenceWithDetails>;