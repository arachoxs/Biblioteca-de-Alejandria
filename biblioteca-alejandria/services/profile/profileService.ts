import { getCurrentUser } from "@/models/authModel";
import {
  getUserProfileById,
  checkUsernameExists,
  updateUserProfile,
} from "@/models/userModel";
import { updateAddress } from "@/models/addressModel";
import { Genero } from "@/lib/types/auth";
import type {
  UserProfileData,
  ProfileUpdatePayload,
  ProfileUpdateResponse,
} from "@/lib/types/profile";

// ─── Lectura del perfil ────────────────────────────────────────────

/**
 * Obtiene los datos completos del perfil combinando:
 * - Tabla `usuario` + join `direccion` (vía modelo)
 * - `auth.users` para correo, username y role (vía sesión)
 *
 * Retorna `null` si el usuario no tiene perfil en la tabla `usuario`.
 */
export async function fetchProfile(): Promise<UserProfileData | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const rawProfile = await getUserProfileById(user.id);

  if (!rawProfile) return null;

  return {
    dni: rawProfile.dni,
    nombres: rawProfile.nombres,
    apellidos: rawProfile.apellidos,
    fecha_nacimiento: rawProfile.fecha_nacimiento,
    lugar_nacimiento: rawProfile.lugar_nacimiento,
    genero: rawProfile.genero as Genero,

    id_direccion: rawProfile.id_direccion,
    direccion_formateada: rawProfile.direccion?.direccion_formateada ?? "",
    direccion_place_id: rawProfile.direccion?.place_id ?? "",
    direccion_detalle: rawProfile.direccion?.detalle_direccion ?? null,

    correo: user.email ?? "",
    usuario:
      (user.user_metadata as Record<string, unknown>)?.username as string ?? "",
  };
}

// ─── Actualización del perfil ──────────────────────────────────────

/**
 * Actualiza el perfil del usuario. Orquesta:
 * 1. Validación de unicidad del username (si cambió).
 * 2. Actualización de la dirección.
 * 3. Actualización del perfil en la tabla `usuario`.
 * 4. Actualización del username en auth.users user_metadata (si cambió).
 */
export async function updateProfile(
  payload: ProfileUpdatePayload
): Promise<ProfileUpdateResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, errors: { form: "No hay sesión activa." } };
    }
    const userId = user.id;

    // 0. Obtener datos actuales de forma segura desde la BD (Server-Side)
    const currentProfile = await fetchProfile();
    if (!currentProfile) {
      return { success: false, errors: { form: "Perfil no encontrado." } };
    }

    const currentUsername = currentProfile.usuario;
    const addressId = currentProfile.id_direccion;

    // 1. Verificar unicidad del username si cambió
    if (payload.usuario !== currentUsername) {
      const usernameCheck = await checkUsernameExists(payload.usuario);
      if (usernameCheck.error) {
        return {
          success: false,
          errors: {
            form: `Error verificando usuario: ${usernameCheck.error}`,
          },
        };
      }
      if (usernameCheck.exists) {
        return {
          success: false,
          errors: { usuario: "El nombre de usuario ya está en uso." },
        };
      }
    }

    // 2. Actualizar dirección
    const addressResult = await updateAddress(addressId, {
      direccion: payload.direccion,
      placeId: payload.direccion_place_id,
      detalle: payload.direccion_detalle ?? undefined,
    });

    if (!addressResult.success) {
      return {
        success: false,
        errors: {
          direccion: `Error al actualizar dirección: ${addressResult.error}`,
        },
      };
    }

    // 3. Actualizar perfil de usuario
    const profileResult = await updateUserProfile(userId, {
      nombres: payload.nombres,
      apellidos: payload.apellidos,
      fecha_nacimiento: payload.fecha_nacimiento,
      lugar_nacimiento: payload.lugar_nacimiento,
      genero: payload.genero,
    });

    if (!profileResult.success) {
      // ROLLBACK: Restaurar dirección anterior
      await updateAddress(addressId, {
        direccion: currentProfile.direccion_formateada,
        placeId: currentProfile.direccion_place_id,
        detalle: currentProfile.direccion_detalle ?? undefined,
      });

      return {
        success: false,
        errors: {
          form: `Error al actualizar perfil: ${profileResult.error}`,
        },
      };
    }

    // 4. Actualizar username en auth si cambió
    if (payload.usuario !== currentUsername) {
      const { createAdminClient } = await import("@/lib/supabase/server");
      const adminClient = createAdminClient();

      const { error } = await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: { username: payload.usuario },
      });

      if (error) {
        console.error("Error al actualizar username en auth:", error);
        
        // ROLLBACK: Restaurar perfil y dirección
        await Promise.all([
          updateUserProfile(userId, {
            nombres: currentProfile.nombres,
            apellidos: currentProfile.apellidos,
            fecha_nacimiento: currentProfile.fecha_nacimiento,
            lugar_nacimiento: currentProfile.lugar_nacimiento,
            genero: currentProfile.genero,
          }),
          updateAddress(addressId, {
            direccion: currentProfile.direccion_formateada,
            placeId: currentProfile.direccion_place_id,
            detalle: currentProfile.direccion_detalle ?? undefined,
          })
        ]);

        return {
          success: false,
          errors: {
            usuario: `Error al actualizar nombre de usuario. Cambios revertidos. Detalle: ${error.message}`,
          },
        };
      }
    }

    return {
      success: true,
      message: "Perfil actualizado correctamente.",
    };
  } catch (error: unknown) {
    console.error("Error inesperado en updateProfile:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Desconocido";
    return {
      success: false,
      errors: { form: `Error inesperado: ${errorMessage}` },
    };
  }
}
