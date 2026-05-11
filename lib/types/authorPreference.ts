import type { Database } from "@/lib/types/supabase";
import type { AuthorRow } from "./author";
import type { ActionResponse, DataResponse } from "@/lib/types/common";

export type AuthorPreferenceRow =
  Database["public"]["Tables"]["preferencia_autor"]["Row"];

export interface AddAuthorPreferenceInput {
  id_autor: number;
}

export interface InsertAuthorPreferencePayload {
  id_usuario: string;
  id_autor: number;
}

export interface AuthorPreferenceWithDetails extends AuthorPreferenceRow {
  autor: AuthorRow;
}

export interface AuthorPreferenceActionResponse extends ActionResponse {
  id?: number;
}

export type AuthorPreferenceDataResponse = DataResponse<AuthorPreferenceWithDetails[]>;
