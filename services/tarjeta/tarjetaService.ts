import { getCurrentUser } from "@/models/authModel";
import {
  createTarjeta,
  getTarjetaById,
  getTarjetasByUserId,
  softDeleteTarjeta,
  addBalance as addBalanceModel,
} from "@/models/tarjetaModel";
import {
  encryptCardNumber,
  encryptCVV,
} from "@/lib/services/crypto";
import {
  validateTarjeta,
  type TarjetaValidationPayload,
} from "@/lib/validations/tarjeta";
import { sanitizeText } from "@/lib/validations/rules";
import { getErrorMessage } from "@/lib/services/errors";

export interface CreateTarjetaInput {
  nombre_titular: string;
  numero_tarjeta: string;
  cvv: string;
  mes_caducidad: number;
  ano_caducidad: number;
  saldo?: number;
}

export interface CreateTarjetaResponse {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
  tarjetaId?: number;
}

export interface GetTarjetasResponse {
  success: boolean;
  tarjetas?: Array<{
    id: number;
    nombre_titular: string;
    mes_caducidad: number;
    ano_caducidad: number;
    saldo: number;
    created_at: string;
  }>;
  error?: string;
}

export interface DeleteTarjetaResponse {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
}

export interface AddBalanceInput {
  tarjetaId: number;
  amount: number;
}

export interface AddBalanceResponse {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
}

function sanitizeTarjetaInput(
  payload: CreateTarjetaInput
): TarjetaValidationPayload {
  return {
    nombre_titular: sanitizeText(payload.nombre_titular),
    numero_tarjeta: payload.numero_tarjeta.trim(),
    cvv: payload.cvv.trim(),
    mes_caducidad: payload.mes_caducidad,
    ano_caducidad: payload.ano_caducidad,
    saldo: payload.saldo,
  };
}

export async function createTarjetaService(
  input: CreateTarjetaInput
): Promise<CreateTarjetaResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, errors: { form: "No hay sesión activa." } };
    }

    const sanitized = sanitizeTarjetaInput(input);
    const errors = validateTarjeta(sanitized);

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const hashNumero = await encryptCardNumber(sanitized.numero_tarjeta);
    const hashCVV = await encryptCVV(sanitized.cvv);

    let tarjetaId: number;
    try {
      tarjetaId = await createTarjeta({
        id_usuario: user.id,
        hash_numero_tarjeta: hashNumero,
        hash_cvv: hashCVV,
        nombre_titular: sanitized.nombre_titular,
        mes_caducidad: sanitized.mes_caducidad,
        ano_caducidad: sanitized.ano_caducidad,
        saldo: sanitized.saldo ?? 0,
      });
    } catch (error) {
      return {
        success: false,
        errors: {
          form: `Error al registrar la tarjeta: ${getErrorMessage(error)}`,
        },
      };
    }

    return {
      success: true,
      message: "Tarjeta registrada correctamente.",
      tarjetaId,
    };
  } catch (error) {
    console.error("[tarjetaService] Error inesperado:", error);
    return {
      success: false,
      errors: { form: `Error inesperado: ${getErrorMessage(error)}` },
    };
  }
}

export async function getTarjetasService(): Promise<GetTarjetasResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "No hay sesión activa." };
    }

    const tarjetas = await getTarjetasByUserId(user.id);

    return {
      success: true,
      tarjetas: tarjetas.map((t) => ({
        id: t.id,
        nombre_titular: t.nombre_titular ?? "",
        mes_caducidad: t.mes_caducidad,
        ano_caducidad: t.ano_caducidad,
        saldo: t.saldo,
        created_at: t.created_at ?? "",
      })),
    };
  } catch (error) {
    console.error("[tarjetaService] Error al obtener tarjetas:", error);
    return {
      success: false,
      error: `Error al obtener tarjetas: ${getErrorMessage(error)}`,
    };
  }
}

export async function deleteTarjetaService(
  tarjetaId: number
): Promise<DeleteTarjetaResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, errors: { form: "No hay sesión activa." } };
    }

    const existing = await getTarjetaById(tarjetaId);
    if (!existing) {
      return { success: false, errors: { form: "Tarjeta no encontrada." } };
    }

    if (existing.id_usuario !== user.id) {
      return {
        success: false,
        errors: { form: "No tienes permiso para eliminar esta tarjeta." },
      };
    }

    try {
      await softDeleteTarjeta(tarjetaId);
    } catch (error) {
      return {
        success: false,
        errors: {
          form: `Error al eliminar la tarjeta: ${getErrorMessage(error)}`,
        },
      };
    }

    return {
      success: true,
      message: "Tarjeta eliminada correctamente.",
    };
  } catch (error) {
    console.error("[tarjetaService] Error inesperado:", error);
    return {
      success: false,
      errors: { form: `Error inesperado: ${getErrorMessage(error)}` },
    };
  }
}

export async function addBalanceService(
  input: AddBalanceInput
): Promise<AddBalanceResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, errors: { form: "No hay sesión activa." } };
    }

    const existing = await getTarjetaById(input.tarjetaId);
    if (!existing) {
      return { success: false, errors: { form: "Tarjeta no encontrada." } };
    }

    if (existing.id_usuario !== user.id) {
      return {
        success: false,
        errors: { form: "No tienes permiso para añadir saldo a esta tarjeta." },
      };
    }

    if (input.amount <= 0) {
      return {
        success: false,
        errors: { amount: "El monto debe ser mayor a 0." },
      };
    }

    if (input.amount > 100000) {
      return {
        success: false,
        errors: { amount: "El monto no puede exceder 100,000 por operación." },
      };
    }

    try {
      await addBalanceModel(input.tarjetaId, input.amount);
    } catch (error) {
      return {
        success: false,
        errors: {
          form: `Error al añadir saldo: ${getErrorMessage(error)}`,
        },
      };
    }

    return {
      success: true,
      message: "Saldo añadido correctamente.",
    };
  } catch (error) {
    console.error("[tarjetaService] Error inesperado:", error);
    return {
      success: false,
      errors: { form: `Error inesperado: ${getErrorMessage(error)}` },
    };
  }
}