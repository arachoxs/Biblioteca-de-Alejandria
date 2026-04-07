import type { Genero } from "./auth";
import type { ActionResponse, DataResponse, Paginated, PaginatedResponse } from "./common";
import type { Database } from "@/lib/types/supabase";



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

// ─── Payloads de Validación y Actualización ──────────────────────────

/**
 * Payload completo para registro y onboarding.
 * Incluye todos los campos del perfil, incluyendo los inmutables.
 */
export interface FullProfilePayload {
  dni: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  lugar_nacimiento: string;
  genero: Genero | string;
  usuario: string;
  direccion: string;
  direccion_place_id: string;
  direccion_detalle?: string | null;
}

/**
 * Payload para actualización de perfil.
 * Excluye campos inmutables: `dni`, `fecha_nacimiento`, `lugar_nacimiento`.
 */
export interface ProfileUpdatePayload {
  nombres: string;
  apellidos: string;
  genero: Genero;
  usuario: string;
  direccion: string;
  direccion_place_id: string;
  direccion_detalle?: string | null;
}

export type EditPerfilFormValues = {
    nombres: string;
    apellidos: string;
    genero: Genero | "";
    direccion_detalle: string;
    usuario: string;
};


/** Resultado de validación con datos sanitizados + errores. */
export interface FullProfileValidationResult {
  errors: Record<string, string>;
  sanitized: FullProfilePayload;
}

/** Resultado de validación para actualización de perfil. */
export interface ProfileUpdateValidationResult {
  errors: Record<string, string>;
  sanitized: ProfileUpdatePayload;
}

// ─── Respuesta del server action ───────────────────────────────────

/**
 * Respuesta de actualización de perfil.
 * @alias ActionResponse - Semánticamente igual.
 */
export type ProfileUpdateResponse = ActionResponse;

// ─── Datos de usuarios administradores (lectura) ─────────────────────────

/**
 * Datos paginados de administradores.
 */
export type PaginatedAdminUsers = Paginated<AdminUserFromView>;

/**
 * Respuesta de listado paginado de administradores.
 */
export type AdminUsersResponse = PaginatedResponse<AdminUserFromView>;

// ─── Búsqueda de administradores ─────────────────────────────────────

/**
 * Respuesta de búsqueda de administradores (sin paginación).
 */
export type AdminSearchResponse = DataResponse<AdminUserFromView[]>;