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
import { validateTarjeta } from "@/lib/validations/tarjeta";
import { isValidPositiveInteger } from "@/lib/validations/rules";

// ─── Crear tarjeta ─────────────────────────────────────────────────

export async function createTarjetaAction(
  nombre_titular: string,
  numero_tarjeta: string,
  cvv: string,
  mes_caducidad: number,
  ano_caducidad: number,
  saldo: number
): Promise<CreateTarjetaResponse> {
  const errors = validateTarjeta({ nombre_titular, numero_tarjeta, cvv, mes_caducidad, ano_caducidad, saldo });
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

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
  if (!isValidPositiveInteger(tarjetaId)) {
    return { success: false, errors: { form: "ID de tarjeta inválido." } };
  }

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
  if (typeof amount !== "number" || isNaN(amount)) {
    return { success: false, errors: { amount: "El monto debe ser un número válido." } };
  }
  if (amount <= 0) {
    return { success: false, errors: { amount: "El monto debe ser mayor a 0." } };
  }
  if (amount > 1000000) {
    return { success: false, errors: { amount: "El monto no puede exceder $1'000.000 por operación." } };
  }

  const result = await addBalanceService({ tarjetaId, amount });
  
  if (result.success) {
    revalidatePath("/perfil");
  }

  return result;
}
