import { Rol } from "@/lib/types/auth";

export function getBrandHref(role: Rol | "VISITANTE", profileComplete: boolean): string {
  if (role === Rol.ROOT) return "/panel-root";
  if (role === Rol.ADMINISTRADOR) {
    return profileComplete ? "/panel-admin" : "/completar-perfil";
  }
  return "/";
}
