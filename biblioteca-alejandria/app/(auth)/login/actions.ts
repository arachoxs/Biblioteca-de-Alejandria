"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  error?: string;
  success?: boolean;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validaciones básicas
  if (!email || !email.trim()) {
    return { error: "El correo electrónico es obligatorio." };
  }

  if (!password || !password.trim()) {
    return { error: "La contraseña es obligatoria." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  // Obtener el rol del usuario desde app_metadata
  const role = data.user?.app_metadata?.role as string | undefined;

  // Redirigir según el rol
  switch (role) {
    case "ROOT":
      redirect("/panel/root");
    case "ADMIN":
      redirect("/panel/admin");
    case "CLIENTE":
    default:
      redirect("/panel/cliente");
  }
}
