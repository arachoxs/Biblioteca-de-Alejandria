"use server";

import "server-only";

import {
  crearHilo as serviceCrearHilo,
  agregarRespuestaCliente,
  getMisHilos,
  getHiloDetalle,
  getStatsCliente,
} from "@/services/mensajeria/mensajeriaService";
import type { ActionResponse } from "@/lib/types/common";
import type {
  HiloActionResponse,
  HiloWithRespuestas,
  HiloListItem,
  HiloStats,
  EstadoHilo,
} from "@/lib/types/hiloMensajeria";
import type { Paginated } from "@/lib/types/common";

export async function crearHiloAction(
  titulo: string,
  mensaje: string
): Promise<HiloActionResponse> {
  return serviceCrearHilo(titulo, mensaje);
}

export async function agregarRespuestaAction(
  hiloId: string,
  mensaje: string
): Promise<ActionResponse> {
  return agregarRespuestaCliente(hiloId, mensaje);
}

export async function getMisHilosAction(
  page: number = 1,
  pageSize: number = 10,
  filtroEstado?: EstadoHilo
): Promise<Paginated<HiloListItem>> {
  return getMisHilos(page, pageSize, filtroEstado);
}

export async function getHiloDetalleAction(
  hiloId: string
): Promise<HiloWithRespuestas | null> {
  return getHiloDetalle(hiloId);
}

export async function getStatsClienteAction(): Promise<HiloStats> {
  return getStatsCliente();
}
