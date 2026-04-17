import type {
  CreateTiendaInput,
  TiendaDia,
  TiendaHorario,
  UpdateTiendaInput,
} from "@/lib/types/tienda";
import { TIENDA_DIAS } from "@/lib/types/tienda";
import {
  maxLengthRule,
  placeIdRequiredRule,
  requiredRule,
  validateFieldRules,
} from "./rules";

export interface TiendaValidationPayload {
  nombre: string;
  direccion: string;
  direccion_place_id: string;
  horario: TiendaHorario;
}

const TIME_24H_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function getMinutesFromTime(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function validateHorario(horario: TiendaHorario): Record<string, string> {
  const errors: Record<string, string> = {};
  let openDaysCount = 0;

  for (const dia of TIENDA_DIAS) {
    const rango = horario[dia];

    if (!rango) continue;
    openDaysCount += 1;

    if (!TIME_24H_REGEX.test(rango.apertura) || !TIME_24H_REGEX.test(rango.cierre)) {
      errors[`horario_${dia}`] = "Usa formato de hora HH:mm (24h).";
      continue;
    }

    if (getMinutesFromTime(rango.apertura) >= getMinutesFromTime(rango.cierre)) {
      errors[`horario_${dia}`] = "La hora de apertura debe ser anterior al cierre.";
    }
  }

  if (openDaysCount === 0) {
    errors.horario = "Debes configurar al menos un día de atención.";
  }

  return errors;
}

/**
 * Valida payload completo para crear una tienda.
 */
export function validateTienda(
  payload: CreateTiendaInput | TiendaValidationPayload,
): Record<string, string> {
  const errors: Record<string, string> = {};

  const nombreError = validateFieldRules(payload.nombre, [
    requiredRule("El nombre de la tienda"),
    maxLengthRule(150, "Nombre"),
  ]);
  if (nombreError) {
    errors.nombre = nombreError;
  }

  const direccionError = validateFieldRules(payload.direccion, [
    requiredRule("Dirección"),
  ]);
  if (direccionError) {
    errors.direccion = direccionError;
  }

  if (!errors.direccion) {
    const placeIdError = validateFieldRules(payload.direccion_place_id, [
      placeIdRequiredRule(),
    ]);
    if (placeIdError) {
      errors.direccion = placeIdError;
    }
  }

  Object.assign(errors, validateHorario(payload.horario));

  return errors;
}

/**
 * Valida payload parcial para actualización de tienda.
 */
export function validateTiendaUpdate(
  payload: UpdateTiendaInput,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (
    payload.nombre === undefined &&
    payload.direccion === undefined &&
    payload.direccion_place_id === undefined &&
    payload.horario === undefined
  ) {
    errors.form = "Debes enviar al menos un campo para actualizar.";
    return errors;
  }

  if (payload.nombre !== undefined) {
    const nombreError = validateFieldRules(payload.nombre, [
      requiredRule("El nombre de la tienda"),
      maxLengthRule(150, "Nombre"),
    ]);

    if (nombreError) {
      errors.nombre = nombreError;
    }
  }

  const hasAddressUpdate =
    payload.direccion !== undefined || payload.direccion_place_id !== undefined;

  if (hasAddressUpdate) {
    const direccionError = validateFieldRules(payload.direccion, [
      requiredRule("Dirección"),
    ]);

    if (direccionError) {
      errors.direccion = direccionError;
    } else {
      const placeIdError = validateFieldRules(payload.direccion_place_id, [
        placeIdRequiredRule(),
      ]);

      if (placeIdError) {
        errors.direccion = placeIdError;
      }
    }
  }

  if (payload.horario !== undefined) {
    Object.assign(errors, validateHorario(payload.horario));
  }

  return errors;
}

export function isTiendaDia(value: string): value is TiendaDia {
  return TIENDA_DIAS.includes(value as TiendaDia);
}
