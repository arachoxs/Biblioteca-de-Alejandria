import {
  createModeloRA as createModeloRAModel,
  getActiveModeloRAById as getActiveModeloRAByIdModel,
  getModeloRAByLibroId as getModeloRAByLibroIdModel,
  softDeleteModeloRAById,
  updateModeloRAById,
} from "@/models/modeloRAModel";
import type {
  InsertModeloRAPayload,
  ModeloRAActionResponse,
  ModeloRADataResponse,
  UpdateModeloRAPayload,
  ModeloRATexturasLibro,
} from "@/lib/types/modelo_ra";
import { requireAdminRole } from "@/lib/validations/server-auth";
import { isValidPositiveInteger } from "@/lib/validations/rules";
import { getErrorMessage } from "@/lib/services/errors";
import {
  validateModeloRACreate,
  validateModeloRAUpdate,
} from "@/lib/validations/modelo-ra";
import {
  uploadTexturaRA,
  type TexturaTipo,
  type TexturaUploadResult,
} from "@/lib/services/ra-storage";

function getInvalidIdResponse(): ModeloRAActionResponse {
  return {
    success: false,
    errors: { form: "El identificador de modelo RA no es válido." },
  };
}

async function fetchModeloRA(
  fetcher: () => Promise<import("@/lib/types/modelo_ra").ModeloRARow | null>,
  notFoundMessage: string,
): Promise<ModeloRADataResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const data = await fetcher();
    if (!data) {
      return { success: false, errors: { form: notFoundMessage } };
    }
    return { success: true, data };
  } catch (error) {
    console.error("Error al obtener el modelo RA:", error);
    return {
      success: false,
      errors: { form: "No se pudo obtener el modelo RA." },
      message: "No se pudo obtener el modelo RA.",
    };
  }
}

export async function getModeloRAById(
  modeloRAId: number,
): Promise<ModeloRADataResponse> {
  if (!isValidPositiveInteger(modeloRAId)) {
    return getInvalidIdResponse();
  }
  return fetchModeloRA(
    () => getActiveModeloRAByIdModel(modeloRAId),
    "El modelo RA no existe o ya fue eliminado.",
  );
}

export async function getModeloRAByLibroId(
  libroId: string,
): Promise<ModeloRADataResponse> {
  return fetchModeloRA(
    () => getModeloRAByLibroIdModel(libroId),
    "El libro no tiene un modelo RA asociado.",
  );
}

/**
 * Crea un modelo RA validando estructura de dimensiones y texturas.
 */
export async function createModeloRA(
  input: InsertModeloRAPayload,
): Promise<ModeloRAActionResponse & { modeloRAId?: number }> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  const errors = validateModeloRACreate(input);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  try {
    const modeloRAId = await createModeloRAModel(input);
    return {
      success: true,
      message: "Modelo RA creado exitosamente.",
      modeloRAId,
    };
  } catch (error) {
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudo crear el modelo RA.",
    };
  }
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

  try {
    await updateModeloRAById(modeloRAId, input);
  } catch (error) {
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudo actualizar el modelo RA.",
    };
  }

  return {
    success: true,
    message: "Modelo RA actualizado exitosamente.",
  };
}

async function uploadAllTexturas(
  files: Partial<Record<TexturaTipo, File>>,
  libroId: string,
): Promise<{ ok: true; texturas: Partial<ModeloRATexturasLibro> } | { ok: false; response: ModeloRAActionResponse }> {
  const uploadPromises: Promise<TexturaUploadResult>[] = [];
  const tipos: TexturaTipo[] = [];

  for (const [tipo, file] of Object.entries(files) as [TexturaTipo, File][]) {
    if (file && file.size > 0) {
      uploadPromises.push(uploadTexturaRA(file, libroId, tipo));
      tipos.push(tipo);
    }
  }

  if (uploadPromises.length === 0) {
    return { ok: true, texturas: {} };
  }

  const results = await Promise.all(uploadPromises);
  const texturas: Partial<ModeloRATexturasLibro> = {};

  for (let i = 0; i < results.length; i++) {
    if (!results[i].success) {
      return {
        ok: false,
        response: {
          success: false,
          errors: { form: results[i].error || "Error subiendo textura." },
          message: `Error subiendo textura "${tipos[i]}".`,
        },
      };
    }
    texturas[tipos[i]] = results[i].url!;
  }

  return { ok: true, texturas };
}

export async function uploadAndUpdateTexturas(
  modeloRAId: number,
  libroId: string,
  files: Partial<Record<TexturaTipo, File>>,
): Promise<ModeloRAActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  const uploadResult = await uploadAllTexturas(files, libroId);
  if (!uploadResult.ok) return uploadResult.response;

  const { texturas } = uploadResult;
  if (Object.keys(texturas).length === 0) {
    return { success: true, message: "No se proporcionaron nuevas texturas." };
  }

  try {
    await updateModeloRAById(modeloRAId, { texturas: texturas as ModeloRATexturasLibro });
  } catch (error) {
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudieron guardar las texturas.",
    };
  }

  return {
    success: true,
    message: "Texturas actualizadas exitosamente.",
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

  try {
    await softDeleteModeloRAById(modeloRAId);
  } catch (error) {
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudo eliminar el modelo RA.",
    };
  }

  return {
    success: true,
    message: "Modelo RA eliminado exitosamente.",
  };
}
