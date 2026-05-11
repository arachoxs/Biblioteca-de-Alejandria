import type { Database } from "@/lib/types/supabase";
import type { AuthorRow } from "./author";

export type AuthorPreferenceRow =
  Database["public"]["Tables"]["preferencia_autor"]["Row"];

export interface InsertAuthorPreferencePayload {
  id_usuario: string;
  id_autor: number;
}

export interface AuthorPreferenceWithDetails extends AuthorPreferenceRow {
  autor: AuthorRow;
}

export interface AuthorPreferenceActionResponse {
  success: boolean;
  error?: string;
  id?: number;
}