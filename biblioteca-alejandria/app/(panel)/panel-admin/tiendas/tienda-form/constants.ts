import { TIENDA_DIAS, type TiendaHorario, type TiendaWithDireccion } from "@/lib/types/tienda";
import type { TiendaFormValues } from "./types";

export const DEFAULT_DAY_RANGE = { apertura: "09:00", cierre: "18:00" };

export const INITIAL_HORARIO: TiendaHorario = {
  lunes: { ...DEFAULT_DAY_RANGE },
  martes: { ...DEFAULT_DAY_RANGE },
  miercoles: { ...DEFAULT_DAY_RANGE },
  jueves: { ...DEFAULT_DAY_RANGE },
  viernes: { ...DEFAULT_DAY_RANGE },
  sabado: null,
  domingo: null,
};

export const INITIAL_VALUES: TiendaFormValues = {
  nombre: "",
  direccion: "",
  direccion_place_id: "",
  horario: cloneHorario(INITIAL_HORARIO),
};

export function cloneHorario(horario: TiendaHorario): TiendaHorario {
  return {
    lunes: horario.lunes ? { ...horario.lunes } : null,
    martes: horario.martes ? { ...horario.martes } : null,
    miercoles: horario.miercoles ? { ...horario.miercoles } : null,
    jueves: horario.jueves ? { ...horario.jueves } : null,
    viernes: horario.viernes ? { ...horario.viernes } : null,
    sabado: horario.sabado ? { ...horario.sabado } : null,
    domingo: horario.domingo ? { ...horario.domingo } : null,
  };
}

export function getInitialValues(tienda?: TiendaWithDireccion | null): TiendaFormValues {
  if (!tienda) {
    return {
      nombre: INITIAL_VALUES.nombre,
      direccion: INITIAL_VALUES.direccion,
      direccion_place_id: INITIAL_VALUES.direccion_place_id,
      horario: cloneHorario(INITIAL_VALUES.horario),
    };
  }

  return {
    nombre: tienda.nombre,
    direccion: tienda.direccion_formateada,
    direccion_place_id: "",
    horario: cloneHorario(tienda.horario),
  };
}

export function isSameHorario(left: TiendaHorario, right: TiendaHorario): boolean {
  for (const dia of TIENDA_DIAS) {
    const leftRange = left[dia];
    const rightRange = right[dia];

    if (leftRange === null && rightRange === null) continue;
    if (!leftRange || !rightRange) return false;

    if (
      leftRange.apertura !== rightRange.apertura ||
      leftRange.cierre !== rightRange.cierre
    ) {
      return false;
    }
  }

  return true;
}
