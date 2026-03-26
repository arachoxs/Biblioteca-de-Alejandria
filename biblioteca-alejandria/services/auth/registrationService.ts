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
  AuthSignUpResult,
  RegisterResponse,
  Rol,
  MailSentResponse
} from "@/lib/types/auth";


import { sendEmail } from "@/lib/services/email";
import { newAdminHtmlTemplate } from "@/lib/templates/email-templates";
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


export async function notifyNewAdmin(email: string, password: string): Promise<MailSentResponse> {
  try {
    const mailResult = await sendEmail({
      to: email,
      subject: "Credenciales de Administrador - Biblioteca de Alejandría",
      html: newAdminHtmlTemplate(email, password),
      text: `Bienvenido. Usuario: ${email}, Contraseña: ${password}`
    });

    return mailResult;
  } catch (error) {
    console.error("Error al enviar correo de credenciales:", error);
    return { success: false, message: "Error al enviar el correo de credenciales." };
  }
}

export async function registerAuthUser(
  credentialData: CredentialData,
  rol: Rol,
  username: string | null = null
): Promise<AuthSignUpResult> {
  if (process.env.NODE_ENV !== "production") {
    console.debug("Iniciando registro de usuario en entorno no productivo");
  }
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

  if (username) {
    const usernameCheck = await checkUsernameExists(username);
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
        message: "El nombre de usuario ya está en uso.",
      };
    }
  }

  const authModelResult = await signUp(credentialData.correo, credentialData.contrasena, username);

  if (!authModelResult.success) {
    return {
      success: false,
      errors: authModelResult.errors,
      message: authModelResult.message,
    };
  }

  const userId = authModelResult.data?.user?.id;
  if (!userId) {
    return {
      success: false,
      errors: { form: "No se pudo obtener el usuario después del registro." },
      message: "No se pudo obtener el usuario después del registro.",
    };
  }

  if (rol !== Rol.CLIENTE) {
    const roleResult = await setUserRole(userId, rol);
    if (!roleResult.success) {
      // Rollback: eliminar usuario Auth
      await deleteAuthUser(userId);
      return {
        success: false,
        errors: { form: `Error al asignar rol: ${roleResult.error}` },
        message: `Error al asignar rol: ${roleResult.error}`,
      };
    }
  }

  if (rol === Rol.ADMINISTRADOR) {
    console.log("Enviando correo de credenciales al nuevo administrador");
    const emailResult = await notifyNewAdmin(credentialData.correo, credentialData.contrasena);
    if (!emailResult.success) {
      //rollback
      await deleteAuthUser(userId);
      return {
        success: false,
        errors: { form: `Error al enviar correo de credenciales: ${emailResult.message}` },
        message: `Error al enviar correo de credenciales: ${emailResult.message}`,
      };
    }
  }

  return authModelResult;
}
export async function register(
  credentialData: CredentialData,
  personalData: PersonalData,
  rol: Rol
): Promise<RegisterResponse> {
  try {

    // ── Paso 1: Validar unicidad ────────────────────────────────
    const dniExists = await checkDniExists(personalData.dni);
    if (dniExists) {
      return {
        success: false,
        errors: { dni: "Este DNI ya se encuentra registrado." },
      };
    }

    // ── Paso 3: llamar servicio para registrar Auth ──────────────────────
    const authResult = await registerAuthUser(credentialData, rol, personalData.usuario);

    if (!authResult.success) {
      return {
        success: false,
        errors: authResult.errors,
        message: authResult.message,
      };
    }

    const userId = authResult.data?.user?.id;

    if (!userId) {
      return {
        success: false,
        errors: { form: "No se pudo obtener el usuario después del registro." },
      };
    }

    // ── Paso 4: Crear dirección ─────────────────────────────────
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

    // ── Paso 5: Crear perfil de usuario ─────────────────────────
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
