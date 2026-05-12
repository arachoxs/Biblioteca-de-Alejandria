import {
  getActiveTiendaByExactName,
  getActiveTiendaByExactNameExcludingId,
  getActiveTiendaById,
} from "@/models/tiendaModel";
import { isTiendaAddressUsed } from "@/models/addressModel";
import { getErrorMessage } from "@/lib/services/errors";
import type {
  AddressErrorOptions,
  CreateTiendaInput,
  NameComparison,
  TiendaActionResponse,
  TiendaRead,
  UpdateAddressDecisionParams,
  UpdateTiendaPrecheckParams,
} from "@/lib/types/tienda";

function isSameName({ left, right }: NameComparison): boolean {
  return left.toLocaleLowerCase() === right.toLocaleLowerCase();
}

function buildDuplicatedNameResponse(): TiendaActionResponse {
  return {
    success: false,
    errors: { nombre: "Ya existe una tienda con ese nombre." },
    message: "Ya existe una tienda con ese nombre.",
  };
}

function buildAddressInUseResponse(): TiendaActionResponse {
  return {
    success: false,
    errors: { direccion: "La dirección ya está asociada a otra tienda." },
    message: "La dirección ya está asociada a otra tienda.",
  };
}

export function buildAddressCreateErrorResponse({
  error,
}: AddressErrorOptions = {}): TiendaActionResponse {
  const message = error ?? "No se pudo registrar la dirección.";
  return {
    success: false,
    errors: { direccion: message },
    message,
  };
}

export async function getCreateTiendaPrecheckError(
  input: CreateTiendaInput,
): Promise<TiendaActionResponse | null> {
  const duplicatedTienda = await getActiveTiendaByExactName(input.nombre);
  if (duplicatedTienda) return buildDuplicatedNameResponse();

  let isAddressUsed: boolean;
  try {
    isAddressUsed = await isTiendaAddressUsed(input.direccion_place_id);
  } catch (error) {
    return buildAddressCreateErrorResponse({ error: getErrorMessage(error) });
  }
  if (isAddressUsed) return buildAddressInUseResponse();

  return null;
}

export async function getUpdateTiendaPrecheckError({
  input,
  currentName,
  tiendaId,
  currentPlaceId,
}: UpdateTiendaPrecheckParams): Promise<TiendaActionResponse | null> {
  // 1. Validación de Nombre (Aislada)
  const nameError = await validateUniqueName(
    input.nombre,
    currentName,
    tiendaId,
  );
  if (nameError) return nameError;

  // 2. Validación de Dirección (Aislada)
  const addressError = await validateAddressAvailability(
    input.direccion_place_id,
    currentPlaceId,
  );
  if (addressError) return addressError;

  return null;
}

// Funciones atómicas auxiliares (reducen la complejidad ciclomática de la función principal)
async function validateUniqueName(
  newName?: string,
  currentName?: string | null,
  id?: string,
) {
  if (!newName || isSameName({ left: newName, right: currentName ?? "" }))
    return null;

  const duplicated = await getActiveTiendaByExactNameExcludingId(
    newName,
    id ?? "",
  );
  return duplicated ? buildDuplicatedNameResponse() : null;
}

async function validateAddressAvailability(
  newPlaceId?: string,
  currentPlaceId?: string | null,
) {
  if (!newPlaceId || newPlaceId === currentPlaceId) return null;

  let isUsed: boolean;
  try {
    isUsed = await isTiendaAddressUsed(newPlaceId);
  } catch (error) {
    return buildAddressCreateErrorResponse({ error: getErrorMessage(error) });
  }
  return isUsed ? buildAddressInUseResponse() : null;
}
export function shouldUpdateAddress({
  input,
  currentPlaceId,
}: UpdateAddressDecisionParams): boolean {
  const hasAddressUpdate =
    input.direccion !== undefined || input.direccion_place_id !== undefined;
  if (!hasAddressUpdate) return false;
  if (
    input.direccion_place_id !== undefined &&
    currentPlaceId === input.direccion_place_id
  ) {
    return false;
  }
  return true;
}

function buildTiendaNotFoundResponse(): TiendaActionResponse {
  return {
    success: false,
    errors: { form: "La tienda no existe o ya fue eliminada." },
    message: "La tienda no existe o ya fue eliminada.",
  };
}

export async function getActiveTiendaOrError(tiendaId: string): Promise<
  | {
      success: true;
      tienda: NonNullable<Awaited<ReturnType<typeof getActiveTiendaById>>>;
    }
  | { success: false; response: TiendaActionResponse }
> {
  let tienda: TiendaRead | null;
  try {
    tienda = await getActiveTiendaById(tiendaId);
  } catch (error) {
    return {
      success: false,
      response: {
        success: false,
        errors: { form: getErrorMessage(error) },
        message: getErrorMessage(error),
      },
    };
  }
  if (!tienda) {
    return { success: false, response: buildTiendaNotFoundResponse() };
  }

  return { success: true, tienda };
}
