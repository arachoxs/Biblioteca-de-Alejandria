import {
  createTienda as createTiendaModel,
  getActiveCopyCountForTienda,
  getActiveTiendaByExactName,
  getActiveTiendaByExactNameExcludingId,
  getActiveTiendaById,
  getTiendas as getTiendasModel,
  softDeleteTiendaById,
  updateTiendaById,
} from "@/models/tiendaModel";
import {
  createAddress,
  deleteAddress,
  isTiendaAddressUsed,
} from "@/models/addressModel";
import type {
  CreateTiendaInput,
  TiendaActionResponse,
  TiendasListResponse,
  UpdateTiendaInput,
  UpdateTiendaPayload,
} from "@/lib/types/tienda";
import { requireAdminRole } from "@/lib/validations/server-auth";

function isSameName(left: string, right: string): boolean {
  return left.toLocaleLowerCase() === right.toLocaleLowerCase();
}

/**
 * Obtiene tiendas activas paginadas para el panel administrativo.
 */
export async function fetchTiendas(
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string,
): Promise<TiendasListResponse> {
  try {
    const roleCheck = await requireAdminRole();
    if (!roleCheck.success) return roleCheck;

    const data = await getTiendasModel(page, pageSize, searchTerm);

    return {
      success: true,
      data,
    };
  } catch (error: unknown) {
    console.error("Error inesperado al obtener tiendas:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    return {
      success: false,
      errors: { form: errorMessage },
      message: "No se pudieron cargar las tiendas.",
    };
  }
}

/**
 * Crea una tienda validando duplicados por nombre.
 */
export async function createTienda(
  input: CreateTiendaInput,
): Promise<TiendaActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;
  let createdAddressId: number | null = null;

  try {
    const duplicatedTienda = await getActiveTiendaByExactName(input.nombre);
    if (duplicatedTienda) {
      return {
        success: false,
        errors: { nombre: "Ya existe una tienda con ese nombre." },
      };
    }

    //verificar que la nueva direccion no este asociada a otra tienda activa
    const isAddressUsed = await isTiendaAddressUsed(input.direccion_place_id);

    if (isAddressUsed) {
      return {
        success: false,
        errors: { direccion: "La dirección ya está asociada a otra tienda." },
      };
    }

    const addressResult = await createAddress({
      direccion: input.direccion,
      placeId: input.direccion_place_id,
    });

    if (!addressResult.success || !addressResult.id) {
      return {
        success: false,
        errors: {
          direccion:
            addressResult.error ?? "No se pudo registrar la dirección.",
        },
      };
    }

    createdAddressId = addressResult.id;

    const result = await createTiendaModel({
      nombre: input.nombre,
      horario: input.horario,
      id_direccion: addressResult.id,
    });

    if (!result.success) {
      if (createdAddressId) {
        await deleteAddress(createdAddressId);
      }
      return {
        success: false,
        errors: { form: result.error ?? "No se pudo crear la tienda." },
        message: "No se pudo crear la tienda.",
      };
    }

    return {
      success: true,
      message: "Tienda creada exitosamente.",
    };
  } catch (error: unknown) {
    console.error("Error inesperado al crear tienda:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    return {
      success: false,
      errors: { form: errorMessage },
      message: "No se pudo crear la tienda.",
    };
  }
}

/**
 * Edita una tienda activa y valida nombre duplicado cuando cambia.
 */
export async function updateTienda(
  tiendaId: string,
  input: UpdateTiendaInput,
): Promise<TiendaActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;
  let createdAddressId: number | null = null;

  try {
    const currentTienda = await getActiveTiendaById(tiendaId);
    if (!currentTienda) {
      return {
        success: false,
        errors: { form: "La tienda no existe o ya fue eliminada." },
      };
    }

    if (
      input.nombre !== undefined &&
      !isSameName(input.nombre, currentTienda.nombre)
    ) {
      const duplicatedTienda = await getActiveTiendaByExactNameExcludingId(
        input.nombre,
        tiendaId,
      );

      if (duplicatedTienda) {
        return {
          success: false,
          errors: { nombre: "Ya existe una tienda con ese nombre." },
        };
      }
    }

    const payload: UpdateTiendaPayload = {
      ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
      ...(input.horario !== undefined ? { horario: input.horario } : {}),
    };

    const shouldUpdateAddress =
      input.direccion !== undefined || input.direccion_place_id !== undefined;

    if (shouldUpdateAddress) {
      const addressResult = await createAddress({
        direccion: input.direccion ?? "",
        placeId: input.direccion_place_id ?? "",
      });

      if (!addressResult.success || !addressResult.id) {
        return {
          success: false,
          errors: {
            direccion:
              addressResult.error ?? "No se pudo registrar la dirección.",
          },
        };
      }

      createdAddressId = addressResult.id;
      payload.id_direccion = addressResult.id;
    }

    const result = await updateTiendaById(tiendaId, payload);
    if (!result.success) {
      if (createdAddressId) {
        await deleteAddress(createdAddressId);
      }
      return {
        success: false,
        errors: { form: result.error ?? "No se pudo actualizar la tienda." },
        message: "No se pudo actualizar la tienda.",
      };
    }

    return {
      success: true,
      message: "Tienda actualizada exitosamente.",
    };
  } catch (error: unknown) {
    console.error("Error inesperado al actualizar tienda:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    return {
      success: false,
      errors: { form: errorMessage },
      message: "No se pudo actualizar la tienda.",
    };
  }
}

/**
 * Elimina lógicamente una tienda activa si no tiene copias asociadas.
 */
export async function deleteTienda(
  tiendaId: string,
): Promise<TiendaActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const currentTienda = await getActiveTiendaById(tiendaId);
    if (!currentTienda) {
      return {
        success: false,
        errors: { form: "La tienda no existe o ya fue eliminada." },
      };
    }

    const activeCopyCount = await getActiveCopyCountForTienda(tiendaId);
    if (activeCopyCount > 0) {
      return {
        success: false,
        errors: {
          form: `No se puede eliminar la tienda porque tiene ${activeCopyCount} copia${activeCopyCount === 1 ? "" : "s"} activa${activeCopyCount === 1 ? "" : "s"} asociada${activeCopyCount === 1 ? "" : "s"}.`,
        },
      };
    }

    const result = await softDeleteTiendaById(tiendaId);
    if (!result.success) {
      return {
        success: false,
        errors: { form: result.error ?? "No se pudo eliminar la tienda." },
        message: "No se pudo eliminar la tienda.",
      };
    }

    return {
      success: true,
      message: "Tienda eliminada exitosamente.",
    };
  } catch (error: unknown) {
    console.error("Error inesperado al eliminar tienda:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    return {
      success: false,
      errors: { form: errorMessage },
      message: "No se pudo eliminar la tienda.",
    };
  }
}
