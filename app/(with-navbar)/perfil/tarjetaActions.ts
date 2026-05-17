"use server";

import { revalidatePath } from "next/cache";

import {
  createTarjetaService,
  getTarjetasService,
  deleteTarjetaService,
  addBalanceService,
  type CreateTarjetaResponse,
  type GetTarjetasResponse,
  type DeleteTarjetaResponse,
  type AddBalanceResponse,
} from "@/services/tarjeta/tarjetaService";

// ─── Crear tarjeta ─────────────────────────────────────────────────

export async function createTarjetaAction(
  nombre_titular: string,
  numero_tarjeta: string,
  cvv: string,
  mes_caducidad: number,
  ano_caducidad: number,
  saldo: number
): Promise<CreateTarjetaResponse> {
  const result = await createTarjetaService({
    nombre_titular,
    numero_tarjeta,
    cvv,
    mes_caducidad,
    ano_caducidad,
    saldo,
  });

  if (result.success) {
    revalidatePath("/perfil");
  }

  return result;
}

// ─── Listar tarjetas del usuario ───────────────────────────────────

export async function getTarjetasAction(): Promise<GetTarjetasResponse> {
  return getTarjetasService();
}

// ─── Eliminar tarjeta ──────────────────────────────────────────────

export async function deleteTarjetaAction(
  tarjetaId: number
): Promise<DeleteTarjetaResponse> {
  const result = await deleteTarjetaService(tarjetaId);
  
  if (result.success) {
    revalidatePath("/perfil");
  }

  return result;
}

// ─── Añadir saldo ──────────────────────────────────────────────────

export async function addBalanceAction(
  tarjetaId: number,
  amount: number
): Promise<AddBalanceResponse> {
  const result = await addBalanceService({ tarjetaId, amount });
  
  if (result.success) {
    revalidatePath("/perfil");
  }

  return result;
}
