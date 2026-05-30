import "server-only";

import { streamText, type UIMessage, convertToModelMessages } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { ChatStreamResponse } from "@/lib/types/ai";
import { getErrorMessage } from "@/lib/services/errors";

// ─── Configuración del proveedor MiMo ─────────────────────────────
export const CHATBOT_MODEL_ID = "mimo-v2-flash";
const MIMO_API_BASE_URL = "https://api.xiaomimimo.com/v1";
const MIMO_PROVIDER_NAME = "mimo";

const mimo = createOpenAICompatible({
  name: MIMO_PROVIDER_NAME,
  apiKey: process.env.AI_GATEWAY_API_KEY!,
  baseURL: MIMO_API_BASE_URL,
});

const SYSTEM_PROMPT =
  "Eres el asistente virtual de la Biblioteca de Alejandría. " +
  "Ayuda a los usuarios con consultas sobre libros, autores, " +
  "categorías, reservas y compras de la tienda. " +
  "Responde de forma breve y amigable en español.";

// ─── Servicio principal ────────────────────────────────────────────

/**
 * Genera una respuesta de streaming del chatbot usando el modelo MiMo.
 * Recibe un historial de mensajes UIMessage y retorna un StreamTextResult.
 */
export async function streamChatbotResponse(
  messages: UIMessage[],
): Promise<ChatStreamResponse> {
  if (!process.env.AI_GATEWAY_API_KEY) {
    return {
      success: false,
      errors: { form: "Falta configurar AI_GATEWAY_API_KEY." },
      message: "Falta configurar AI_GATEWAY_API_KEY.",
    };
  }

  if (!messages || messages.length === 0) {
    return {
      success: false,
      errors: { form: "No hay mensajes para procesar." },
      message: "No hay mensajes para procesar.",
    };
  }

  try {
    const result = streamText({
      model: mimo(CHATBOT_MODEL_ID),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
    });

    return { success: true, stream: result };
  } catch (error) {
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudo generar la respuesta del chatbot.",
    };
  }
}
