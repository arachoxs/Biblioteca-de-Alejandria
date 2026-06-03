"use server";

import "server-only";

import { getContadorNoLeidos } from "@/services/mensajeria/mensajeriaService";

export async function getContadorNoLeidosAction(): Promise<number> {
  return getContadorNoLeidos();
}
