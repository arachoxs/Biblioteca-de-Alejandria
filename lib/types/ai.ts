import type { ActionResponse } from "@/lib/types/common";

/**
 * Tipo del resultado de streamText().
 * Usamos `any` porque StreamTextResult es genérico sobre los tools
 * y la función retorna diferentes tool sets según la configuración.
 * El frontend consume el stream sin necesidad de saber los tipos exactos.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ChatStreamResult = any;

export interface ChatStreamResponse extends ActionResponse {
  stream?: ChatStreamResult;
}
