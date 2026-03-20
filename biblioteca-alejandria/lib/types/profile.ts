import type { Genero } from "./auth";

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
