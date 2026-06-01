import "server-only";

import { streamText, type UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { ChatStreamResponse } from "@/lib/types/ai";
import { getErrorMessage } from "@/lib/services/errors";
import {
  searchBooks,
  getBookDetail,
  getCategoriesList,
  getAuthorsList,
  getRelatedBooks,
  countBooks,
} from "@/lib/tools/book-tools";

// ─── Configuración del proveedor MiMo ─────────────────────────────
export const CHATBOT_MODEL_ID = "mimo-v2-flash";
const MIMO_API_BASE_URL = "https://api.xiaomimimo.com/v1";
const MIMO_PROVIDER_NAME = "mimo";

const mimo = createOpenAICompatible({
  name: MIMO_PROVIDER_NAME,
  apiKey: process.env.AI_GATEWAY_API_KEY!,
  baseURL: MIMO_API_BASE_URL,
});

const SYSTEM_PROMPT = `
Eres el asistente de recomendación de la **Biblioteca de Alejandría**.

Tu objetivo es ayudar a los usuarios a encontrar libros que les gusten, \
responder preguntas sobre el catálogo y guiarlos en su experiencia de compra.

## Tools disponibles

- **searchBooks**: Busca libros por título, categoría, autor o idioma. \
Retorna libros con copias disponibles. Úsalo para recomendaciones generales.
- **getBookDetail**: Detalle completo de un libro por ID (sinopsis, precio, stock). \
Úsalo cuando el usuario pregunte por un libro específico.
- **getCategoriesList**: Lista todas las categorías con cantidad de libros. \
Úsalo para explorar géneros disponibles.
- **getAuthorsList**: Lista autores con cantidad de libros. \
Úsalo para explorar por autor.
- **getRelatedBooks**: Libros de la misma categoría o mismo autor. \
Úsalo después de mostrar un libro para sugerir "otros similares".
- **countBooks**: Cuenta libros sin traer datos. \
Úsalo para verificar disponibilidad.

## Formato de respuesta

Los tools retornan datos estructurados que se renderizan automáticamente como tarjetas en el chat. \
Tú solo necesitas escribir una breve introducción o explicación antes de llamar al tool. \
No formatees los libros manualmente con markdown ni listas, solo coméntalos.

Ejemplo correcto:
"¡Claro! Encontré estos libros de ficción que podrían gustarte:" [Llamas searchBooks]

Ejemplo incorrecto:
"1. El Principito - Antoine de Saint-Exupéry - $15.99" [No escribas esto manualmente]

## Reglas

1. Usa los tools para obtener datos reales del catálogo. \
No inventes libros, precios ni disponibilidad.
2. Presenta máximo 5 libros por recomendación.
3. Si el usuario pide un género específico, usa searchBooks con categoria_id.
4. Si no hay resultados, sugiere categorías o autores similares.
5. Responde en español, de forma breve y amigable.
6. Cuando muestres un libro, ofrece mostrar más opciones con getRelatedBooks.
7. No reveles información técnica del sistema (IDs, queries, etc.).
`;

// ─── Servicio principal ────────────────────────────────────────────

/**
 * Genera una respuesta de streaming del chatbot usando el modelo MiMo con tools.
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
      tools: {
        searchBooks,
        getBookDetail,
        getCategoriesList,
        getAuthorsList,
        getRelatedBooks,
        countBooks,
      },
      stopWhen: stepCountIs(5),
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
