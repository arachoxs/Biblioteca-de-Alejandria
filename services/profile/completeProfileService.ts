import { getCurrentUser } from "@/models/authModel";
import {
  checkDniExists,
  checkUsernameExists,
  createUserProfile,
  deleteUserProfile,
} from "@/models/userModel";
import { createAddress, deleteAddress } from "@/models/addressModel";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/services/errors";
import type { PersonalData, Genero } from "@/lib/types/auth";
import type { ProfileUpdateResponse, FullProfilePayload } from "@/lib/types/profile";

// ─── Helpers ─────────────────────────────────────────────────────────

interface UserMetadata {
  appMeta: Record<string, unknown>;
  userMeta: Record<string, unknown>;
}

async function rollbackProfileCreation(
  userId: string | null,
  addressId: number | null,
  profileCreated: boolean,
): Promise<void> {
  if (profileCreated && userId) {
    await deleteUserProfile(userId).catch((e) =>
      console.error("Rollback profile error:", e),
    );
  }
  if (addressId) {
    await deleteAddress(addressId).catch((e) =>
      console.error("Rollback address error:", e),
    );
  }
}

async function getUserMetadataSafe(
  userId: string,
  adminClient: ReturnType<typeof createAdminClient>,
): Promise<UserMetadata> {
  const { data, error } = await adminClient.auth.admin.getUserById(userId);
  if (error) return { appMeta: {}, userMeta: {} };
  return {
    appMeta:
      data?.user?.app_metadata && typeof data.user.app_metadata === "object"
        ? data.user.app_metadata
        : {},
    userMeta:
      data?.user?.user_metadata && typeof data.user.user_metadata === "object"
        ? data.user.user_metadata
        : {},
  };
}

async function updateUserPassword(
  userId: string,
  password: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  return error ? error.message : null;
}

// ─── Tipos ─────────────────────────────────────────────────────────

interface CompleteAdminProfileInput extends FullProfilePayload {
  genero: Genero; // Override: en este flujo siempre es Genero, no string
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
  let createdAddressId: number | null = null;
  let profileCreated = false;
  let userId: string | null = null;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, errors: { form: "No hay sesión activa." } };
    }
    userId = user.id;

    const dniExists = await checkDniExists(input.dni);
    if (dniExists) {
      return {
        success: false,
        errors: { dni: "El usuario o documento de identidad ya ha sido registrado en otra cuenta. Por favor pruebe con otro." },
      };
    }

    const usernameExists = await checkUsernameExists(input.usuario);
    if (usernameExists) {
      return {
        success: false,
        errors: { usuario: "El usuario o documento de identidad ya ha sido registrado en otra cuenta. Por favor pruebe con otro." },
      };
    }

    let addressId: number;
    try {
      addressId = await createAddress({
        direccion: input.direccion,
        placeId: input.direccion_place_id,
        detalle: input.direccion_detalle ?? undefined,
      });
    } catch (error) {
      return {
        success: false,
        errors: { direccion: `Error al registrar dirección: ${getErrorMessage(error)}` },
      };
    }
    createdAddressId = addressId;

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

    try {
      await createUserProfile(userId, personalData, addressId);
      profileCreated = true;
    } catch (error) {
      await rollbackProfileCreation(userId, createdAddressId, profileCreated);
      return {
        success: false,
        errors: { form: `Error al crear perfil: ${getErrorMessage(error)}` },
      };
    }

    const adminClient = createAdminClient();
    const { appMeta: existingAppMetadata, userMeta: existingUserMetadata } =
      await getUserMetadataSafe(userId, adminClient);

    const updatedAppMetadata = { ...existingAppMetadata, profile_complete: true };
    const updatedUserMetadata = { ...existingUserMetadata, username: input.usuario };

    const { error: metaError } = await adminClient.auth.admin.updateUserById(
      userId,
      { app_metadata: updatedAppMetadata, user_metadata: updatedUserMetadata }
    );

    if (metaError) {
      console.error("Error al marcar profile_complete:", metaError);
      await rollbackProfileCreation(userId, createdAddressId, profileCreated);
      const metaErrorMessage =
        metaError instanceof Error ? metaError.message : "Error al actualizar metadatos de usuario.";
      return {
        success: false,
        errors: {
          form: `No se pudo finalizar la configuración del perfil. Detalle: ${metaErrorMessage}`,
        },
      };
    }

    const pwdError = await updateUserPassword(userId, input.nueva_contrasena);

    if (pwdError) {
      console.error("Error al actualizar contraseña:", pwdError);
      try {
        await adminClient.auth.admin.updateUserById(userId, {
          app_metadata: existingAppMetadata,
          user_metadata: existingUserMetadata,
        });
      } catch (err) {
        console.error("Error crítico al revertir metadatos:", err);
      }
      await rollbackProfileCreation(userId, createdAddressId, profileCreated);
      return {
        success: false,
        errors: { form: "No se pudo actualizar la contraseña. Revisa que sea segura e intenta de nuevo." },
      };
    }

    return { success: true, message: "Perfil configurado exitosamente." };
  } catch (error: unknown) {
    console.error("Error inesperado en completeAdminProfile:", error);
    await rollbackProfileCreation(userId, createdAddressId, profileCreated);
    const errorMessage = error instanceof Error ? error.message : "Desconocido";
    return {
      success: false,
      errors: { form: `Error inesperado: ${errorMessage}` },
    };
  }
}
