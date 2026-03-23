import { createAdminClient } from "@/lib/supabase/server";
import type { PersonalData, Genero } from "@/lib/types/auth";
// ─── Tipos internos ────────────────────────────────────────────────

interface ModelResult {
  success: boolean;
  error?: string;
}

/** Datos crudos del perfil obtenidos por join usuario + dirección. */
export interface RawUserProfile {
  dni: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  lugar_nacimiento: string;
  genero: Genero;
  id_direccion: number;
  direccion: {
    direccion_formateada: string;
    place_id: string;
    detalle_direccion: string | null;
  } | null;
}

// ─── Consultas de perfil ───────────────────────────────────────────

/**
 * Obtiene el perfil del usuario con la dirección asociada (join).
 * Retorna `null` si el usuario no existe.
 */
export async function getUserProfileById(
  userId: string
): Promise<RawUserProfile | null> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("usuario")
    .select(
      `
      dni,
      nombres,
      apellidos,
      fecha_nacimiento,
      lugar_nacimiento,
      genero,
      id_direccion,
      direccion (
        direccion_formateada,
        place_id,
        detalle_direccion
      )
    `
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error al obtener perfil del usuario:", error);
    throw error;
  }

  return data as RawUserProfile | null;
}

/**
 * Actualiza los campos editables del perfil en la tabla `usuario`.
 * Nunca modifica `dni` ni `id` por diseño.
 */
export async function updateUserProfile(
  userId: string,
  data: {
    nombres: string;
    apellidos: string;
    fecha_nacimiento: string;
    lugar_nacimiento: string;
    genero: Genero;
    id_direccion?: number;
  }
): Promise<ModelResult> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("usuario")
    .update({
      nombres: data.nombres,
      apellidos: data.apellidos,
      fecha_nacimiento: data.fecha_nacimiento,
      lugar_nacimiento: data.lugar_nacimiento,
      genero: data.genero,
      ...(data.id_direccion !== undefined && {
        id_direccion: data.id_direccion,
      }),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error al actualizar perfil del usuario:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Validaciones de unicidad ──────────────────────────────────────

/**
 * Verifica si ya existe un usuario con el DNI proporcionado.
 */
export async function checkDniExists(dni: string): Promise<boolean> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("usuario")
    .select("dni")
    .eq("dni", dni)
    .maybeSingle();

  if (error) {
    console.error("Error al verificar DNI:", error);
    throw error;
  }

  return !!data;
}

/**
 * Verifica si el nombre de usuario ya está en uso.
 * Utiliza la función RPC `check_username_exists` del servidor.
 */
export async function checkUsernameExists(
  username: string
): Promise<{ exists: boolean; error?: string }> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.rpc("check_username_exists", {
    username_check: username,
  });

  if (error) {
    console.error("Error al verificar username:", error);
    return { exists: false, error: error.message };
  }

  return { exists: !!data };
}

// ─── Operaciones CRUD ──────────────────────────────────────────────

/**
 * Crea o actualiza el perfil del usuario en la tabla `usuario`.
 *
 * Utiliza `upsert` para manejar tanto la creación como la
 * actualización si un trigger ya creó el registro base.
 */
export async function createUserProfile(
  userId: string,
  personalData: PersonalData,
  addressId: number
): Promise<ModelResult> {
  const adminClient = createAdminClient();

  const { error } = await adminClient.from("usuario").upsert({
    id: userId,
    dni: personalData.dni,
    nombres: personalData.nombres,
    apellidos: personalData.apellidos,
    fecha_nacimiento: personalData.fecha_nacimiento,
    lugar_nacimiento: personalData.lugar_nacimiento,
    genero: personalData.genero,
    id_direccion: addressId,
  });

  if (error) {
    console.error("Error al registrar el perfil del usuario:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Elimina el perfil del usuario en la tabla `usuario`.
 * Utilizado principalmente para operaciones de rollback.
 */
export async function deleteUserProfile(
  userId: string
): Promise<ModelResult> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("usuario")
    .delete()
    .eq("id", userId);

  if (error) {
    console.error("Error al eliminar el perfil del usuario:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}