import {
  signUp,
  setUserRole,
  deleteAuthUser,
  isCurrentUserRoot,
} from "@/models/authModel";
import {
  checkDniExists,
  checkUsernameExists,
  createUserProfile,
} from "@/models/userModel";
import { createAddress, deleteAddress } from "@/models/addressModel";
import {
  CredentialData,
  PersonalData,
  RegisterResponse,
  Rol,
} from "@/lib/types/auth";

/**
 * Orquesta el flujo completo de registro de usuario:
 *
 * 1. Verificación de permisos (solo ROOT puede crear no-CLIENTE).
 * 2. Validación de unicidad (DNI, username).
 * 3. Registro en Supabase Auth.
 * 4. Asignación de rol (si no es CLIENTE).
 * 5. Creación de dirección.
 * 6. Creación de perfil de usuario.
 *
 * Incluye rollback automático si cualquier paso intermedio falla.
 */
export async function register(
  credentialData: CredentialData,
  personalData: PersonalData,
  rol: Rol
): Promise<RegisterResponse> {
  try {
    // ── Paso 1: Verificar permisos ──────────────────────────────
    if (rol !== Rol.CLIENTE) {
      const isRoot = await isCurrentUserRoot();
      if (!isRoot) {
        return {
          success: false,
          errors: { form: "No tienes permisos para registrar nuevos usuarios." },
          message: "Permisos insuficientes para registrar usuarios.",
        };
      }
    }

    // ── Paso 2: Validar unicidad ────────────────────────────────
    const dniExists = await checkDniExists(personalData.dni);
    if (dniExists) {
      return {
        success: false,
        errors: { dni: "Este DNI ya se encuentra registrado." },
      };
    }

    const usernameCheck = await checkUsernameExists(personalData.usuario);
    if (usernameCheck.error) {
      return {
        success: false,
        errors: { form: `Error verificando usuario. ${usernameCheck.error}` },
        message: `Error al verificar el nombre de usuario. ${usernameCheck.error}`,
      };
    }
    if (usernameCheck.exists) {
      return {
        success: false,
        errors: { usuario: "El nombre de usuario ya está en uso." },
      };
    }

    // ── Paso 3: Registrar en Supabase Auth ──────────────────────
    const authResult = await signUp(
      credentialData.correo,
      credentialData.contrasena,
      personalData.usuario
    );

    if (!authResult.success) {
      return {
        success: false,
        errors: authResult.errors,
      };
    }

    const userId = authResult.data?.user?.id;
    if (!userId) {
      return {
        success: false,
        errors: { form: "No se pudo obtener el usuario después del registro." },
      };
    }

    // ── Paso 4: Asignar rol (si no es CLIENTE) ──────────────────
    if (rol !== Rol.CLIENTE) {
      const roleResult = await setUserRole(userId, rol);
      if (!roleResult.success) {
        // Rollback: eliminar usuario Auth
        await deleteAuthUser(userId);
        return {
          success: false,
          errors: { form: `Error al asignar rol: ${roleResult.error}` },
        };
      }
    }

    // ── Paso 5: Crear dirección ─────────────────────────────────
    const addressResult = await createAddress({
      direccion: personalData.direccion,
      placeId: personalData.direccion_place_id,
      detalle: personalData.direccion_detalle,
    });

    if (!addressResult.success || !addressResult.id) {
      // Rollback: eliminar usuario Auth
      await deleteAuthUser(userId);
      return {
        success: false,
        errors: { direccion: `Error al registrar dirección: ${addressResult.error}` },
      };
    }

    // ── Paso 6: Crear perfil de usuario ─────────────────────────
    const profileResult = await createUserProfile(
      userId,
      personalData,
      addressResult.id
    );

    if (!profileResult.success) {
      // Rollback completo: eliminar usuario Auth y dirección
      await deleteAuthUser(userId);
      await deleteAddress(addressResult.id);
      return {
        success: false,
        errors: { form: `Error al crear perfil: ${profileResult.error}` },
      };
    }

    console.log("Usuario registrado exitosamente:", userId);
    return { success: true, message: "Registro exitoso. ¡Bienvenido!" };
  } catch (error: unknown) {
    console.error("Error inesperado en registro:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Desconocido";

    return {
      success: false,
      errors: { form: `Error inesperado: ${errorMessage}` },
    };
  }
}
