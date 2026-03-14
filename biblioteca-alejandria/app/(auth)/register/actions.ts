"use server";

import { createClient } from "@/lib/supabase/server";
import {ROLES} from "@/lib/auth/roles";

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
  const { data , error: authError } = await supabase.auth.signUp({
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
    throw new Error("Error al registrar el usuario");
  }

  console.log(data.user);

}

async function registerAddress(address: string) {
  // Lógica para registrar la dirección usando la API de Google Places
  // y devolver el place_id correspondiente.
  return "mock_place_id";
}