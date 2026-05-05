import type { CopiaActionResponse } from "@/lib/types/copia";
import type { TransferCopiasByQuantityErrorCode } from "@/models/copiaModel";

interface StoreReference {
  id: string;
  nombre: string;
}

interface TransferCopiasByQuantityEntityValidationInput {
  originStore: StoreReference | null;
  destinationStore: StoreReference | null;
  libroExists: boolean;
}

interface TransferCopiasByQuantityModelResult {
  success: boolean;
  error?: string;
  errorCode?: TransferCopiasByQuantityErrorCode;
}

function getInsufficientStockMessage(availableCount: number): string {
  return `Solo hay ${availableCount} copia${availableCount === 1 ? "" : "s"} disponible${availableCount === 1 ? "" : "s"} para trasladar en la tienda origen.`;
}

function buildOriginStoreNotFoundResponse(): CopiaActionResponse {
  return {
    success: false,
    errors: {
      id_tienda_origen: "La tienda origen no existe o fue eliminada.",
    },
    message: "La tienda origen no existe o fue eliminada.",
  };
}

function buildDestinationStoreNotFoundResponse(): CopiaActionResponse {
  return {
    success: false,
    errors: {
      id_tienda_destino: "La tienda destino no existe o fue eliminada.",
    },
    message: "La tienda destino no existe o fue eliminada.",
  };
}

function buildEqualStoresResponse(): CopiaActionResponse {
  return {
    success: false,
    errors: {
      id_tienda_destino: "La tienda destino debe ser distinta a la tienda origen.",
    },
    message:
      "La tienda destino debe ser distinta a la tienda origen para realizar el traslado.",
  };
}

function buildLibroNotFoundResponse(): CopiaActionResponse {
  return {
    success: false,
    errors: {
      id_libro: "El libro indicado no existe o fue eliminado.",
    },
    message: "El libro indicado no existe o fue eliminado.",
  };
}

function buildRequestedStockUnavailableResponse(
  availableCount: number,
): CopiaActionResponse {
  return {
    success: false,
    errors: {
      cantidad: getInsufficientStockMessage(availableCount),
    },
    message:
      "No hay suficientes copias disponibles en la tienda origen para completar el traslado.",
  };
}

function buildChangedAvailabilityResponse(): CopiaActionResponse {
  return {
    success: false,
    errors: { cantidad: "La disponibilidad cambió durante el traslado." },
    message:
      "No hay suficientes copias disponibles en la tienda origen para completar el traslado.",
  };
}

function buildTransferInventoryFailureResponse(error?: string): CopiaActionResponse {
  const message = error ?? "No se pudo trasladar el inventario.";
  return {
    success: false,
    errors: { form: message },
    message,
  };
}

export function validateTransferCopiasByQuantityEntities(
  input: TransferCopiasByQuantityEntityValidationInput,
):
  | {
      success: true;
      originStore: StoreReference;
      destinationStore: StoreReference;
    }
  | { success: false; response: CopiaActionResponse } {
  if (!input.originStore) {
    return { success: false, response: buildOriginStoreNotFoundResponse() };
  }
  if (!input.destinationStore) {
    return { success: false, response: buildDestinationStoreNotFoundResponse() };
  }
  if (input.originStore.id === input.destinationStore.id) {
    return { success: false, response: buildEqualStoresResponse() };
  }
  if (!input.libroExists) {
    return { success: false, response: buildLibroNotFoundResponse() };
  }

  return {
    success: true,
    originStore: input.originStore,
    destinationStore: input.destinationStore,
  };
}

export function getTransferCopiasByQuantityStockError({
  availableCount,
  requestedQuantity,
}: {
  availableCount: number;
  requestedQuantity: number;
}): CopiaActionResponse | null {
  if (availableCount >= requestedQuantity) return null;
  return buildRequestedStockUnavailableResponse(availableCount);
}

export function getTransferCopiasByQuantityModelError(
  transferResult: TransferCopiasByQuantityModelResult,
): CopiaActionResponse | null {
  if (transferResult.success) return null;

  if (transferResult.errorCode === "INSUFFICIENT_STOCK") {
    return buildChangedAvailabilityResponse();
  }

  return buildTransferInventoryFailureResponse(transferResult.error);
}

export function buildTransferCopiasByQuantitySuccessMessage(
  quantity: number,
): string {
  return quantity === 1
    ? "Inventario trasladado exitosamente."
    : `${quantity} copias trasladadas exitosamente.`;
}
