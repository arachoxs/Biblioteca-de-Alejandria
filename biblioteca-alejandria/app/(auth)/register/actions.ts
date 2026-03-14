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
  usuario: string;
}

export async function registerUser(
  credentialData: CredentialData,
  personalData: PersonalData
) {

  const supabase = await createClient();

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
    throw new Error(`Error al registrar el usuario: ${authError.message}`);
  }

  if (!data.user) {
    throw new Error("No se pudo obtener el usuario después del registro");
  }

  // Cliente admin para inserciones (bypasea RLS — usuario aún no tiene sesión activa)
  const adminClient = createAdminClient();

  // Insertar la dirección
  const { data: direccionData, error: dirError } = await adminClient
    .from('direccion')
    .insert({
      direccion_formateada: personalData.direccion,
      place_id: personalData.direccion_place_id
    })
    .select('id')
    .single();

  if (dirError) {
    console.error("Error al registrar la dirección:", dirError);
    throw new Error(`Error al registrar la dirección del usuario: ${dirError.message}`);
  }

  // Insertar el perfil del usuario
  const { error: dbError } = await adminClient
    .from('usuario')
    .insert({
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
    throw new Error(`Error al registrar el perfil del usuario: ${dbError.message}`);
  }

  console.log("Usuario registrado exitosamente:", data.user.id);
}
