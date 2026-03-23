import type { Genero } from "./auth";
import type { Database } from "@/lib/types/supabase"; // Importa el tipo Database generado por Supabase



/**
 * Fila de la vista `vista_administradores`.
 * Se sobreescribe `id` como `string` (no nulo) porque proviene de
 * `auth.users.id`, que es clave primaria y nunca puede ser null.
 */
export type AdminUserFromView = Omit<
  Database['public']['Views']['vista_administradores']['Row'],
  'id'
> & { id: string };
// ─── Datos del perfil (lectura) ────────────────────────────────────


/** Datos completos del usuario para renderizar la página de perfil. */
export interface UserProfileData {
  // Tabla `usuario`
  dni: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  lugar_nacimiento: string;
  genero: Genero;

  // Tabla `direccion` (via FK id_direccion)
  id_direccion: number;
  direccion_formateada: string;
  direccion_place_id: string;
  direccion_detalle: string | null;

  // Datos de auth.users
  correo: string;
  usuario: string; // user_metadata.username
}

// ─── Payload de actualización ──────────────────────────────────────

/** Datos enviados para actualizar el perfil. Excluye `dni` y `correo`. */
export interface ProfileUpdatePayload {
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  lugar_nacimiento: string;
  genero: Genero;
  usuario: string;

  // Dirección
  direccion: string;
  direccion_place_id: string;
  direccion_detalle?: string | null;
}

// ─── Respuesta del server action ───────────────────────────────────

export interface ProfileUpdateResponse {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
}

// ─── Datos de usuarios administradores (lectura) ─────────────────────────
export interface PaginatedAdminUsers {
  data: AdminUserFromView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminUsersResponse {
  success: boolean;
  data?: PaginatedAdminUsers;
  errors?: Record<string, string>;
  message?: string;
}