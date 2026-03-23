import { getCurrentUser } from "@/models/authModel";
import {
  checkDniExists,
  checkUsernameExists,
  createUserProfile,
} from "@/models/userModel";
import { createAddress, deleteAddress } from "@/models/addressModel";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { PersonalData, Genero } from "@/lib/types/auth";
import type { ProfileUpdateResponse } from "@/lib/types/profile";

// ─── Tipos ─────────────────────────────────────────────────────────

interface CompleteAdminProfileInput {
  dni: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  lugar_nacimiento: string;
  genero: Genero;
  usuario: string;
  direccion: string;
  direccion_place_id: string;
  direccion_detalle?: string | null;
  nueva_contrasena: string;
}

// ─── Servicio ──────────────────────────────────────────────────────

/**
 * Orquesta el flujo de completar perfil para un admin recién creado:
 *
 * 1. Validar unicidad de DNI y username.
 * 2. Actualizar contraseña (sin verificar la actual).
 * 3. Crear dirección.
 * 4. Crear perfil en public.usuario.
 * 5. Marcar profile_complete en app_metadata + setear username.
 *
 * Incluye rollback si algún paso intermedio falla.
 */
export async function completeAdminProfile(
  input: CompleteAdminProfileInput
): Promise<ProfileUpdateResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, errors: { form: "No hay sesión activa." } };
    }
    const userId = user.id;

    // 1. Validar unicidad de DNI
    const dniExists = await checkDniExists(input.dni);
    if (dniExists) {
      return {
        success: false,
        errors: { dni: "El usuario o documento de identidad ya ha sido registrado en otra cuenta. Por favor pruebe con otro." },
      };
    }

    // 2. Validar unicidad de username
    const usernameCheck = await checkUsernameExists(input.usuario);
    if (usernameCheck.error) {
      return {
        success: false,
        errors: { form: `Error verificando usuario: ${usernameCheck.error}` },
      };
    }
    if (usernameCheck.exists) {
      return {
        success: false,
        errors: { usuario: "El usuario o documento de identidad ya ha sido registrado en otra cuenta. Por favor pruebe con otro." },
      };
    }

    // 3. Actualizar contraseña (sin verificar la actual — caso especial primer inicio)
    const supabase = await createClient();
    const { error: pwdError } = await supabase.auth.updateUser({
      password: input.nueva_contrasena,
    });

    if (pwdError) {
      console.error("Error al actualizar contraseña:", pwdError);
      return {
        success: false,
        errors: { form: "No se pudo actualizar la contraseña. Intenta de nuevo." },
      };
    }

    // 4. Crear dirección
    const addressResult = await createAddress({
      direccion: input.direccion,
      placeId: input.direccion_place_id,
      detalle: input.direccion_detalle ?? undefined,
    });

    if (!addressResult.success || !addressResult.id) {
      return {
        success: false,
        errors: { direccion: `Error al registrar dirección: ${addressResult.error}` },
      };
    }

    // 5. Crear perfil de usuario
    const personalData: PersonalData = {
      dni: input.dni,
      nombres: input.nombres,
      apellidos: input.apellidos,
      fecha_nacimiento: input.fecha_nacimiento,
      lugar_nacimiento: input.lugar_nacimiento,
      genero: input.genero,
      direccion: input.direccion,
      direccion_place_id: input.direccion_place_id,
      direccion_detalle: input.direccion_detalle ?? undefined,
      usuario: input.usuario,
    };

    const profileResult = await createUserProfile(
      userId,
      personalData,
      addressResult.id
    );

    if (!profileResult.success) {
      // Rollback: eliminar dirección creada
      await deleteAddress(addressResult.id);
      return {
        success: false,
        errors: { form: `Error al crear perfil: ${profileResult.error}` },
      };
    }

    // 6. Marcar profile_complete en app_metadata + actualizar username
    const adminClient = createAdminClient();

    // Obtener metadata actual para no perder claves críticas (p.ej. role)
    const { data: userData, error: fetchUserError } =
      await adminClient.auth.admin.getUserById(userId);

    if (fetchUserError) {
      console.error("Error al obtener app_metadata actual:", fetchUserError);
    }

    const existingAppMetadata =
      userData?.user?.app_metadata && typeof userData.user.app_metadata === "object"
        ? userData.user.app_metadata
        : {};

    const existingUserMetadata =
      userData?.user?.user_metadata && typeof userData.user.user_metadata === "object"
        ? userData.user.user_metadata
        : {};

    const updatedAppMetadata = {
      ...existingAppMetadata,
      profile_complete: true,
    };

    const updatedUserMetadata = {
      ...existingUserMetadata,
      username: input.usuario,
    };

    const { error: metaError } = await adminClient.auth.admin.updateUserById(
      userId,
      {
        app_metadata: updatedAppMetadata,
        user_metadata: updatedUserMetadata,
      }
    );
    if (metaError) {
      console.error("Error al marcar profile_complete:", metaError);
      // Este paso es crítico para que el middleware permita el acceso.
      // Si falla, consideramos que el flujo no se completó correctamente.
      const metaErrorMessage =
        metaError instanceof Error ? metaError.message : "Error al actualizar metadatos de usuario.";
      return {
        success: false,
        errors: {
          form: `No se pudo finalizar la configuración del perfil. Detalle: ${metaErrorMessage}`,
        },
      };
    }

    return {
      success: true,
      message: "Perfil configurado exitosamente.",
    };
  } catch (error: unknown) {
    console.error("Error inesperado en completeAdminProfile:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Desconocido";
    return {
      success: false,
      errors: { form: `Error inesperado: ${errorMessage}` },
    };
  }
}
