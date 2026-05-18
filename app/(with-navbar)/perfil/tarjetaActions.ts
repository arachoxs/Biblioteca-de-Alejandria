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
  type CreateTarjetaInput,
} from "@/services/tarjeta/tarjetaService";
import { validateTarjeta } from "@/lib/validations/tarjeta";
import { isValidPositiveInteger } from "@/lib/validations/rules";

// ─── Crear tarjeta ─────────────────────────────────────────────────

export async function createTarjetaAction(
  input: CreateTarjetaInput
): Promise<CreateTarjetaResponse> {
  const errors = validateTarjeta(input);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const result = await createTarjetaService(input);

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
