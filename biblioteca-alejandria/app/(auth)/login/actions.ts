"use server";

import { redirect } from "next/navigation";
import { LoginState } from "@/lib/types/auth";
import { signIn } from "@/models/authModel";
import { Rol } from "@/lib/auth/roles";

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

  const data = await signIn(email.trim(), password);

  if (!data) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  // Obtener el rol del usuario desde app_metadata
  const role = data.user?.app_metadata?.role as Rol | undefined;

  // Redirigir según el rol
  switch (role) {
    case Rol.ROOT:
      redirect("/panel-root");
    case Rol.ADMINISTRADOR:
      redirect("/panel-admin");
    case Rol.CLIENTE:
    default:
      redirect("/");
  }
}
