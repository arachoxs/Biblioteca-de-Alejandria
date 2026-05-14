import { requireClientRole } from "@/lib/validations/server-auth";
import { getCurrentUser } from "@/models/authModel";
import type { ActionResponse } from "@/lib/types/common";
import type { User } from "@supabase/supabase-js";

export async function getAuthenticatedUser(): Promise<
  { success: true; user: User } |
  ActionResponse
> {
  const roleCheck = await requireClientRole();
  if (!roleCheck.success) return roleCheck;

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, errors: { form: "No hay sesión activa." }, message: "No hay sesión activa." };
  }

  return { success: true, user };
}
