"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ROLES } from "@/lib/auth/roles";

export enum Genero {
  Masculino = "masculino",
  Femenino = "femenino",
  Otro = "otro",
}

export interface CredentialData {
  correo: string;
  contrasena: string;
}

export interface PersonalData {
  dni: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  lugar_nacimiento: string;
  genero: Genero;
  direccion: string;
  direccion_place_id: string;
  direccion_detalle?: string;
  usuario: string;
}

export interface RegisterResponse { //respuesta que se envia al frontend
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
}

export async function registerUser(
  credentialData: CredentialData,
  personalData: PersonalData
): Promise<RegisterResponse> {

  const supabase = await createClient();
  const adminClient = createAdminClient();

  try {
    // Verificar si el nombre de usuario ya existe
    const { data: usernameExists, error: rpcError } = await adminClient.rpc('check_username_exists', { 
      username_check: personalData.usuario 
    });

    if (rpcError) {
      console.error("Error al verificar username:", rpcError);
      return { 
        success: false, 
        errors: { form: `Error verificando usuario: ${rpcError.message}` } 
      };
    }

    if (usernameExists) {
      return { 
        success: false, 
        errors: { usuario: "El nombre de usuario ya está en uso." } 
      };
    }

    // Registrar el usuario en Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email: credentialData.correo,
      password: credentialData.contrasena,
      options: {
        data: {
          rol: ROLES.CLIENTE,
          username: personalData.usuario
        }
      }
    });

    if (authError) {
      console.error("Error al registrar el usuario en Supabase Auth:", authError);
      
      // Mapear error de usuario ya registrado (dependiendo de configuración de Supabase)
      if (authError.message.toLowerCase().includes("already registered") || authError.status === 422) {
          return {
            success: false,
            errors: { correo: "Este correo electrónico ya está registrado." }
          };
      }

      return { 
        success: false, 
        errors: { form: `Error en autenticación: ${authError.message}` } 
      };
    }

    if (!data.user) {
      return { 
        success: false, 
        errors: { form: "No se pudo obtener el usuario después del registro" } 
      };
    }

    // Insertar la dirección
    const { data: direccionData, error: dirError } = await adminClient
      .from('direccion')
      .insert({
        direccion_formateada: personalData.direccion,
        place_id: personalData.direccion_place_id,
        detalle_direccion: personalData.direccion_detalle? personalData.direccion_detalle : null
      })
      .select('id')
      .single();

    if (dirError) {
      console.error("Error al registrar la dirección:", dirError);
      // Rollback: Eliminar el usuario creado en Auth
      await adminClient.auth.admin.deleteUser(data.user.id);
      
      return { 
        success: false, 
        errors: { direccion: `Error al registrar dirección: ${dirError.message}` } 
      };
    }

    // Insertar el perfil del usuario utilizando upsert para manejar tanto la creación
    // como la actualización si un trigger ya creó el registro base.
    const { error: dbError } = await adminClient
      .from('usuario')
      .upsert({
        id: data.user.id,
        dni: personalData.dni,
        nombres: personalData.nombres,
        apellidos: personalData.apellidos,
        fecha_nacimiento: personalData.fecha_nacimiento,
        lugar_nacimiento: personalData.lugar_nacimiento,
        genero: personalData.genero,
        id_direccion: direccionData.id
      });

    if (dbError) {
      console.error("Error al registrar el perfil del usuario:", dbError);
      
      // Rollback completo: Eliminar usuario Auth y la dirección creada
      await adminClient.auth.admin.deleteUser(data.user.id);
      await adminClient.from('direccion').delete().eq('id', direccionData.id);

      // Error de unicidad (PostgreSQL code 23505)
      if (dbError.code === '23505') {
        if (dbError.message.includes("dni") || dbError.details?.includes("dni")) {
          return { 
            success: false, 
            errors: { dni: "Este DNI ya se encuentra registrado." } 
          };
        }
      }

      return { 
        success: false, 
        errors: { form: `Error al crear perfil: ${dbError.message}` } 
      };
    }

    console.log("Usuario registrado exitosamente:", data.user.id);
    return { success: true, message: "Registro exitoso. ¡Bienvenido!" };

  } catch (error: unknown) {
    console.error("Error inesperado en registro:", error);
    // Verificamos si es un objeto Error estándar
    const errorMessage = error instanceof Error ? error.message : "Desconocido";

    return { 
      success: false, 
      errors: { form: `Error inesperado: ${errorMessage}` } 
    };
  }
}
