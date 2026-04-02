"use server";

import { redirect } from "next/navigation";
import { Rol, type LoginState } from "@/lib/types/auth";
import { signIn } from "@/models/authModel";
import { sanitizeText, validateRequiredString, validateEmail } from "@/lib/validations/rules";

export async function loginAction(
  email: string,
  password: string
): Promise<LoginState> {
  const cleanEmail = sanitizeText(email);

  const emailReq = validateRequiredString(cleanEmail, "El correo electrónico");
  if (emailReq) return { error: emailReq };

  const emailFmt = validateEmail(cleanEmail);
  if (emailFmt) return { error: emailFmt };

  const pwdReq = validateRequiredString(password, "La contraseña");
  if (pwdReq) return { error: pwdReq };

  const data = await signIn(cleanEmail, password);

  if (!data) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  const role = data.user?.app_metadata?.role as Rol | undefined;

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
