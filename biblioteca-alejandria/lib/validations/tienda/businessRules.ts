import {
  getActiveTiendaByExactName,
  getActiveTiendaByExactNameExcludingId,
  getActiveTiendaById,
} from "@/models/tiendaModel";
import { isTiendaAddressUsed } from "@/models/addressModel";
import type {
  AddressErrorOptions,
  CreateTiendaInput,
  NameComparison,
  TiendaActionResponse,
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

export function buildAddressCreateErrorResponse(
  { error }: AddressErrorOptions = {},
): TiendaActionResponse {
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

  const isAddressUsed = await isTiendaAddressUsed(input.direccion_place_id);
  if (isAddressUsed) return buildAddressInUseResponse();

  return null;
}

export async function getUpdateTiendaPrecheckError(
  { input, currentName, tiendaId, currentPlaceId }: UpdateTiendaPrecheckParams,
): Promise<TiendaActionResponse | null> {
  if (
    input.nombre !== undefined &&
    !isSameName({ left: input.nombre, right: currentName })
  ) {
    const duplicatedTienda = await getActiveTiendaByExactNameExcludingId(
      input.nombre,
      tiendaId,
    );
    if (duplicatedTienda) return buildDuplicatedNameResponse();
  }

  if (input.direccion_place_id && currentPlaceId !== input.direccion_place_id) {
    const isAddressUsed = await isTiendaAddressUsed(input.direccion_place_id);
    if (isAddressUsed) return buildAddressInUseResponse();
  }

  return null;
}

export function shouldUpdateAddress(
  { input, currentPlaceId }: UpdateAddressDecisionParams,
): boolean {
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
  const tienda = await getActiveTiendaById(tiendaId);
  if (!tienda) {
    return { success: false, response: buildTiendaNotFoundResponse() };
  }

  return { success: true, tienda };
}
