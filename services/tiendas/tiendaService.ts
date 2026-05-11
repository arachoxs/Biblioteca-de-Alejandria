import {
  createTienda as createTiendaModel,
  getActiveCopyCountForTienda,
  getTiendas as getTiendasModel,
  softDeleteTiendaById,
  updateTiendaById,
} from "@/models/tiendaModel";
import {
  createAddress,
  deleteAddress,
  getPlaceIdByAddressId,
} from "@/models/addressModel";
import type {
  AddressCleanupInput,
  AddressCreationInput,
  CreateTiendaInput,
  DeleteTiendaParams,
  FetchTiendasParams,
  TiendaActionResponse,
  TiendasListResponse,
  UpdateTiendaInput,
  UpdateTiendaParams,
  UpdateTiendaPayload,
} from "@/lib/types/tienda";
import { requireAdminRole } from "@/lib/validations/server-auth";
import { getCurrentUser } from "@/models/authModel";
import { logAdminAction } from "@/services/admin/auditService";
import { AccionAdministrador } from "@/lib/types/audit";
import {
  buildAddressCreateErrorResponse,
  getActiveTiendaOrError,
  getCreateTiendaPrecheckError,
  getUpdateTiendaPrecheckError,
  shouldUpdateAddress,
} from "@/services/rules/tiendaRules";

async function createTiendaAddress({
  direccion,
  placeId,
}: AddressCreationInput): Promise<{
  id?: number;
  errorResponse?: TiendaActionResponse;
}> {
  const addressResult = await createAddress({ direccion, placeId });
  if (!addressResult.success || !addressResult.id) {
    return {
      errorResponse: buildAddressCreateErrorResponse({
        error: addressResult.error,
      }),
    };
  }

  return { id: addressResult.id };
}

async function deleteAddressIfCreated({
  addressId,
}: AddressCleanupInput): Promise<void> {
  if (!addressId) return;
  await deleteAddress(addressId);
}

async function logTiendaAction(payload: {
  action: AccionAdministrador;
  description: string;
  entity: {
    id: string;
    entity_type: "tienda";
    display_name: string;
  };
}): Promise<void> {
  const actor = await getCurrentUser();
  if (!actor) return;
  await logAdminAction({
    actorId: actor.id,
    action: payload.action,
    description: payload.description,
    entity: payload.entity,
  });
}

/**
 * Obtiene tiendas activas paginadas para el panel administrativo.
 */
export async function fetchTiendas({
  page = 1,
  pageSize = 10,
  searchTerm,
}: FetchTiendasParams = {}): Promise<TiendasListResponse> {
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
    const precheckError = await getCreateTiendaPrecheckError(input);
    if (precheckError) return precheckError;

    const addressResult = await createTiendaAddress({
      direccion: input.direccion,
      placeId: input.direccion_place_id,
    });
    if (addressResult.errorResponse) return addressResult.errorResponse;

    createdAddressId = addressResult.id ?? null;

    const result = await createTiendaModel({
      nombre: input.nombre,
      horario: input.horario,
      id_direccion: addressResult.id as number,
    });

    if (!result.success) {
      await deleteAddressIfCreated({ addressId: createdAddressId });
      return {
        success: false,
        errors: { form: result.error ?? "No se pudo crear la tienda." },
        message: "No se pudo crear la tienda.",
      };
    }

    await logTiendaAction({
      action: AccionAdministrador.CREAR,
      description: `Se creó la tienda "${input.nombre}".`,
      entity: {
        id: String(result.id),
        entity_type: "tienda",
        display_name: input.nombre,
      },
    });

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
export async function updateTienda({
  tiendaId,
  input,
}: UpdateTiendaParams): Promise<TiendaActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;
  let createdAddressId: number | null = null;

  try {
    const currentTiendaResult = await getActiveTiendaOrError(tiendaId);
    if (!currentTiendaResult.success) {
      return currentTiendaResult.response;
    }
    const currentTienda = currentTiendaResult.tienda;

    const currentPlaceId = await getPlaceIdByAddressId(
      currentTienda.id_direccion,
    );

    const precheckError = await getUpdateTiendaPrecheckError({
      input,
      currentName: currentTienda.nombre,
      tiendaId,
      currentPlaceId,
    });
    if (precheckError) return precheckError;

    const payload: UpdateTiendaPayload = {
      ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
      ...(input.horario !== undefined ? { horario: input.horario } : {}),
    };

    if (shouldUpdateAddress({ input, currentPlaceId })) {
      const addressResult = await createTiendaAddress({
        direccion: input.direccion ?? "",
        placeId: input.direccion_place_id ?? "",
      });
      if (addressResult.errorResponse) return addressResult.errorResponse;

      createdAddressId = addressResult.id ?? null;
      payload.id_direccion = addressResult.id as number;
    }

    const result = await updateTiendaById(tiendaId, payload);
    if (!result.success) {
      await deleteAddressIfCreated({ addressId: createdAddressId });
      return {
        success: false,
        errors: { form: result.error ?? "No se pudo actualizar la tienda." },
        message: "No se pudo actualizar la tienda.",
      };
    }

    await logTiendaAction({
      action: AccionAdministrador.MODIFICAR,
      description: `Se actualizó la tienda "${payload.nombre ?? currentTienda.nombre}".`,
      entity: {
        id: tiendaId,
        entity_type: "tienda",
        display_name: payload.nombre ?? currentTienda.nombre,
      },
    });

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
export async function deleteTienda({
  tiendaId,
}: DeleteTiendaParams): Promise<TiendaActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const currentTiendaResult = await getActiveTiendaOrError(tiendaId);
    if (!currentTiendaResult.success) {
      return currentTiendaResult.response;
    }
    const currentTienda = currentTiendaResult.tienda;

    const activeCopyCount = await getActiveCopyCountForTienda(tiendaId);
    if (activeCopyCount > 0) {
      const cannotDeleteMessage = `No se puede eliminar la tienda porque tiene ${activeCopyCount} copia${activeCopyCount === 1 ? "" : "s"} activa${activeCopyCount === 1 ? "" : "s"} asociada${activeCopyCount === 1 ? "" : "s"}.`;
      return {
        success: false,
        errors: {
          form: cannotDeleteMessage,
        },
        message: cannotDeleteMessage,
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

    const actor = await getCurrentUser();
    if (actor) {
      await logAdminAction({
        actorId: actor.id,
        action: AccionAdministrador.ELIMINAR,
        description: `Se eliminó la tienda "${currentTienda.nombre}".`,
        entity: {
          id: tiendaId,
          entity_type: "tienda",
          display_name: currentTienda.nombre,
        },
      });
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
