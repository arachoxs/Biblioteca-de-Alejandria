import { createAdminClient } from "@/lib/supabase/server";
import { PersonalData } from "@/lib/types/auth";

// ─── Tipos internos ────────────────────────────────────────────────

interface ModelResult {
  success: boolean;
  error?: string;
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