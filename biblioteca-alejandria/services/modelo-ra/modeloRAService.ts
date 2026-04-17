import {
  createModeloRA as createModeloRAModel,
  getActiveModeloRAById as getActiveModeloRAByIdModel,
  softDeleteModeloRAById,
  updateModeloRAById,
} from "@/models/modeloRAModel";
import type {
  InsertModeloRAPayload,
  ModeloRAActionResponse,
  ModeloRADataResponse,
  UpdateModeloRAPayload,
} from "@/lib/types/modelo_ra";
import { requireAdminRole } from "@/lib/validations/server-auth";
import { isValidPositiveInteger } from "@/lib/validations/rules";
import {
  validateModeloRACreate,
  validateModeloRAUpdate,
} from "@/lib/validations/modelo-ra";

function getInvalidIdResponse(): ModeloRAActionResponse {
  return {
    success: false,
    errors: { form: "El identificador de modelo RA no es válido." },
  };
}

/**
 * Obtiene un modelo RA activo por ID.
 */
export async function getModeloRAById(
  modeloRAId: number,
): Promise<ModeloRADataResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  if (!isValidPositiveInteger(modeloRAId)) {
    return getInvalidIdResponse();
  }

  const data = await getActiveModeloRAByIdModel(modeloRAId);
  if (!data) {
    return {
      success: false,
      errors: { form: "El modelo RA no existe o ya fue eliminado." },
    };
  }

  return {
    success: true,
    data,
  };
}

/**
 * Crea un modelo RA validando estructura de dimensiones y texturas.
 */
export async function createModeloRA(
  input: InsertModeloRAPayload,
): Promise<ModeloRAActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  const errors = validateModeloRACreate(input);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const result = await createModeloRAModel(input);
  if (!result.success) {
    return {
      success: false,
      errors: { form: result.error ?? "No se pudo crear el modelo RA." },
      message: "No se pudo crear el modelo RA.",
    };
  }

  return {
    success: true,
    message: "Modelo RA creado exitosamente.",
  };
}

/**
 * Actualiza un modelo RA activo.
 */
export async function updateModeloRA(
  modeloRAId: number,
  input: UpdateModeloRAPayload,
): Promise<ModeloRAActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  if (!isValidPositiveInteger(modeloRAId)) {
    return getInvalidIdResponse();
  }

  const errors = validateModeloRAUpdate(input);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const result = await updateModeloRAById(modeloRAId, input);
  if (!result.success) {
    return {
      success: false,
      errors: { form: result.error ?? "No se pudo actualizar el modelo RA." },
      message: "No se pudo actualizar el modelo RA.",
    };
  }

  return {
    success: true,
    message: "Modelo RA actualizado exitosamente.",
  };
}

/**
 * Elimina lógicamente un modelo RA (flujo invocado desde libro).
 */
export async function deleteModeloRA(
  modeloRAId: number,
): Promise<ModeloRAActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  if (!isValidPositiveInteger(modeloRAId)) {
    return getInvalidIdResponse();
  }

  const result = await softDeleteModeloRAById(modeloRAId);
  if (!result.success) {
    return {
      success: false,
      errors: { form: result.error ?? "No se pudo eliminar el modelo RA." },
      message: "No se pudo eliminar el modelo RA.",
    };
  }

  return {
    success: true,
    message: "Modelo RA eliminado exitosamente.",
  };
}
