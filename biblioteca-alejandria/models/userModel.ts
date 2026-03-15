import { createClient, createAdminClient } from "@/lib/supabase/server";
import { CredentialData, PersonalData, RegisterResponse, Rol as RolEnum } from "@/lib/types/auth";
import { AuthResponse } from "@supabase/supabase-js";

type InternalAuthResponse = RegisterResponse & {
  data?: AuthResponse['data'];
};

export async function registerAuthUser(
  credentialData: CredentialData,
  rol: RolEnum,
  usuario: string | null
): Promise<InternalAuthResponse> {
  const supabase = await createClient();

  const { data: { user: requester } } = await supabase.auth.getUser(); //obtiene la informacion del usuario actual, que es el que esta haciendo la peticion, en este caso el admin o root
  
  const isRoot = requester?.user_metadata?.rol === RolEnum.ROOT;

  if (rol != RolEnum.CLIENTE && !isRoot ) {
    return {
      success: false,
      errors: { form: "No tienes permisos para registrar nuevos usuarios." },
      message: "Permisos insuficientes para registrar usuarios." 
    }
  }

  // Registrar el usuario en Supabase Auth si es un cliente o si es un admin/root registrando otro admin/root
  const { data, error: authError } = await supabase.auth.signUp({
    email: credentialData.correo,
    password: credentialData.contrasena,
    options: {
      data: {
        rol: rol,
        username: usuario
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

  return { success: true, data: data };

}

export async function registerUser(
  credentialData: CredentialData,
  personalData: PersonalData,
  Rol: RolEnum
): Promise<RegisterResponse> {
  const adminClient = createAdminClient();

  try {
    const { data: dniExists, error: dniError } = await adminClient
      .from('usuario')
      .select('dni')
      .eq('dni', personalData.dni)
      .maybeSingle(); // Usamos maybeSingle para que no lance error si no encuentra nada

    if (dniExists) {
      return { 
        success: false, 
        errors: { dni: "Este DNI ya se encuentra registrado." } 
      };
    }

    if (dniError) {
      console.error("Error técnico al validar DNI:", dniError);
      return { 
        success: false, 
        errors: { form: "Error de servidor al validar identidad." } 
    };
}
    // Verificar si el nombre de usuario ya existe
    const { data: usernameExists, error: rpcError } = await adminClient.rpc('check_username_exists', { 
      username_check: personalData.usuario 
    });

    if (rpcError) {
      console.error("Error al verificar username:", rpcError);
      return { 
        success: false, 
        errors: { form: `Error verificando usuario. ${rpcError.message}` } ,
        message: `Error al verificar el nombre de usuario. ${rpcError.message}`
      };
    }

    if (usernameExists) {
      return { 
        success: false, 
        errors: { usuario: "El nombre de usuario ya está en uso." } 
      };
    }

    const authResult = await registerAuthUser(credentialData, Rol, personalData.usuario);

    if (!authResult.success) {
      return authResult; // Propagar errores de autenticación
    }

    const data = authResult.data as AuthResponse['data'];

    if (!data?.user) {
      return { 
        success: false, 
        errors: { form: "No se pudo obtener el usuario después del registro" } 
      };
    }

    const userId = data.user.id;

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
      await adminClient.auth.admin.deleteUser(userId);
      
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
        id: userId,
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
      await adminClient.auth.admin.deleteUser(userId);
      await adminClient.from('direccion').delete().eq('id', direccionData.id);

      return { 
        success: false, 
        errors: { form: `Error al crear perfil: ${dbError.message}` } 
      };
    }

    console.log("Usuario registrado exitosamente:", userId);
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