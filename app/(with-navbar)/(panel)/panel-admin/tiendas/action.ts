"use server";

import {
  createTienda,
  deleteTienda,
  fetchTiendas,
  updateTienda,
} from "@/services/tiendas/tiendaService";
import {
  TIENDA_DIAS,
  type CreateTiendaInput,
  type TiendaActionResponse,
  type TiendaHorario,
  type TiendasListResponse,
  type UpdateTiendaInput,
} from "@/lib/types/tienda";
import {
  validateTienda,
  validateTiendaUpdate,
} from "@/lib/validations/tienda";
import { sanitizeText, toSafePositiveInt } from "@/lib/validations/rules";

function sanitizeHorario(horario: TiendaHorario): TiendaHorario {
  const sanitized = {} as TiendaHorario;

  for (const dia of TIENDA_DIAS) {
    const rango = horario[dia];
    sanitized[dia] = rango
      ? {
          apertura: sanitizeText(rango.apertura),
          cierre: sanitizeText(rango.cierre),
        }
      : null;
  }

  return sanitized;
}

function sanitizeCreatePayload(input: CreateTiendaInput): CreateTiendaInput {
  return {
    nombre: sanitizeText(input.nombre),
    direccion: sanitizeText(input.direccion),
    direccion_place_id: input.direccion_place_id.trim(),
    horario: sanitizeHorario(input.horario),
  };
}

function sanitizeUpdatePayload(input: UpdateTiendaInput): UpdateTiendaInput {
  return {
    ...(input.nombre !== undefined
      ? { nombre: sanitizeText(input.nombre) }
      : {}),
    ...(input.direccion !== undefined
      ? { direccion: sanitizeText(input.direccion) }
      : {}),
    ...(input.direccion_place_id !== undefined
      ? { direccion_place_id: input.direccion_place_id.trim() }
      : {}),
    ...(input.horario !== undefined
      ? { horario: sanitizeHorario(input.horario) }
      : {}),
  };
}

/**
 * Server Action: obtiene tiendas activas paginadas.
 */
export async function getTiendasAction(
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string,
): Promise<TiendasListResponse> {
  const safePage = toSafePositiveInt(page, 1);
  const safePageSize = toSafePositiveInt(pageSize, 10);
  const cleanTerm = searchTerm ? sanitizeText(searchTerm) : undefined;
  return await fetchTiendas({
    page: safePage,
    pageSize: safePageSize,
    searchTerm: cleanTerm,
  });
}

/**
 * Server Action: crea una tienda.
 */
export async function createTiendaAction(
  input: CreateTiendaInput,
): Promise<TiendaActionResponse> {
  const sanitized = sanitizeCreatePayload(input);
  const errors = validateTienda(sanitized);

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return await createTienda(sanitized);
}

/**
 * Server Action: actualiza una tienda existente.
 */
export async function updateTiendaAction(
  tiendaId: string,
  input: UpdateTiendaInput,
): Promise<TiendaActionResponse> {
  const cleanTiendaId = sanitizeText(tiendaId);
  if (cleanTiendaId === "") {
    return {
      success: false,
      errors: { form: "El identificador de tienda no es válido." },
    };
  }

  const sanitized = sanitizeUpdatePayload(input);
  const errors = validateTiendaUpdate(sanitized);

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return await updateTienda({ tiendaId: cleanTiendaId, input: sanitized });
}

/**
 * Server Action: elimina lógicamente una tienda.
 */
export async function deleteTiendaAction(
  tiendaId: string,
): Promise<TiendaActionResponse> {
  const cleanTiendaId = sanitizeText(tiendaId);
  if (cleanTiendaId === "") {
    return {
      success: false,
      errors: { form: "El identificador de tienda no es válido." },
    };
  }

  return await deleteTienda({ tiendaId: cleanTiendaId });
}
