"use server";

import "server-only";

import {
  agregarRespuestaAdmin,
  cerrarHiloAdmin,
  reabrirHiloAdmin,
  getAllHilosAdmin,
  getHiloDetalle,
  getStatsAdmin,
} from "@/services/mensajeria/mensajeriaService";
import type { ActionResponse } from "@/lib/types/common";
import type {
  HiloWithRespuestas,
  HiloListItem,
  HiloStats,
  EstadoHilo,
} from "@/lib/types/hiloMensajeria";
import type { Paginated } from "@/lib/types/common";

export async function agregarRespuestaAdminAction(
  hiloId: string,
  mensaje: string
): Promise<ActionResponse> {
  return agregarRespuestaAdmin(hiloId, mensaje);
}

export async function cerrarHiloAdminAction(
  hiloId: string
): Promise<ActionResponse> {
  return cerrarHiloAdmin(hiloId);
}

export async function reabrirHiloAdminAction(
  hiloId: string
): Promise<ActionResponse> {
  return reabrirHiloAdmin(hiloId);
}

export async function getAllHilosAdminAction(
  page: number = 1,
  pageSize: number = 10,
  filtroEstado?: EstadoHilo
): Promise<Paginated<HiloListItem>> {
  return getAllHilosAdmin(page, pageSize, filtroEstado);
}

export async function getHiloDetalleAdminAction(
  hiloId: string
): Promise<HiloWithRespuestas | null> {
  return getHiloDetalle(hiloId);
}

export async function getStatsAdminAction(): Promise<HiloStats> {
  return getStatsAdmin();
}
