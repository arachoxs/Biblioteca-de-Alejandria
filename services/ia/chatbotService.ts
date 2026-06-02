import "server-only";

import {
  generateText,
  type UIMessage,
  convertToModelMessages,
  stepCountIs,
} from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { ChatResponse, BookData } from "@/lib/types/ai";
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
Eres el asistente de la **Biblioteca de Alejandría**.

## Dominio estricto

Tu ÚNICO propósito es ayudar con el catálogo de libros: \
buscar, recomendar, mostrar detalles y explorar categorías o autores. \
NO respondas preguntas fuera de este dominio.

Si el usuario pregunta algo no relacionado con libros, \
responde EXACTAMENTE con esta frase y nada más:
"No puedo ayudarte con eso. Estoy aquí para recomendarte libros del catálogo de la Biblioteca de Alejandría."

Ejemplos de preguntas FUERA de dominio (debes rechazarlas):
- Matemáticas, ciencia, historia, programación, etc.
- Opiniones personales, consejos de vida, chistes
- Preguntas sobre ti, sobre IA, sobre tecnología
- Cualquier tema que no sea libros, autores, categorías o el catálogo

Ejemplos de preguntas DENTRO del dominio (debes responderlas):
- "¿Qué libros de ciencia ficción tienes?"
- "Muéstrame libros de Gabriel García Márquez"
- "¿Cuántos libros hay de suspense?"
- "¿Tienen El Principito?"
- "Recommiéndame algo similar a Cien años de soledad"

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

SIEMPRE usa un tool cuando el usuario pida libros. \
NUNCA inventes libros, precios ni disponibilidad.

## Formato de respuesta

REGLA CRÍTICA: NUNCA escribas títulos, autores, precios o categorías de libros en tu texto. \
La interfaz renderiza automáticamente las tarjetas de libros con esa información. \
Si escribes los libros manualmente, el usuario los verá DOS VECES.

Usa formato **Markdown** para dar estructura a tus respuestas:
- **Negrita** para resaltar términos importantes
- Listas con \`-\` para opciones (NO para listar libros)
- Párrafos separados por líneas en blanco para mejorar legibilidad

Tu texto debe ser SOLO una breve intro antes de llamar al tool. Ejemplos:
- "¡Encontré algunos libros que te podrían gustar!"
- "Aquí tienes algunas opciones de **ficción**:"
- "Déjame buscar algo similar para ti."

NUNCA listes libros en tu respuesta. Solo escribe la introducción y llama al tool.

## Reglas

1. SIEMPRE usa los tools para obtener datos reales del catálogo.
2. Presenta máximo 5 libros por recomendación.
3. Si el usuario pide un género específico, usa searchBooks con categoria_id.
4. Si no hay resultados, sugiere categorías o autores similares.
5. Responde en español, de forma breve y amigable.
6. Cuando muestres un libro, ofrece mostrar más opciones con getRelatedBooks.
7. No reveles información técnica del sistema (IDs, queries, etc.).
8. Responde UNA sola vez. NUNCA repitas tu respuesta o parte de ella.
9. No incluyas razonamiento ni explicaciones internas en tu respuesta.
10. RECHAZA cualquier pregunta fuera del dominio de libros con la frase indicada. \
NO agregues explicaciones adicionales al rechazar.
`;

// ─── Servicio principal ────────────────────────────────────────────

function extractBooksFromSearch(
  output: Record<string, unknown>,
): BookData[] {
  if (!Array.isArray(output.libros)) return [];
  return output.libros as BookData[];
}

function extractBooksFromDetail(
  output: Record<string, unknown>,
): BookData[] {
  if (!output.found || !output.libro) return [];
  return [output.libro as BookData];
}

function extractBooksFromRelated(
  output: Record<string, unknown>,
): BookData[] {
  if (!output.found || !Array.isArray(output.relaciones)) return [];
  return output.relaciones.flatMap((r) =>
    typeof r === "object" && r !== null && Array.isArray(r.libros)
      ? (r.libros as BookData[])
      : [],
  );
}

function extractBooksFromStepResult(
  result: { toolName?: string; output?: unknown },
): BookData[] {
  const output = result.output as Record<string, unknown> | undefined;
  if (!output) return [];

  switch (result.toolName) {
    case "searchBooks":
      return extractBooksFromSearch(output);
    case "getBookDetail":
      return extractBooksFromDetail(output);
    case "getRelatedBooks":
      return extractBooksFromRelated(output);
    default:
      return [];
  }
}

function extractBooksFromSteps(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  steps: any[],
): BookData[] {
  const books = steps.flatMap((step) =>
    (step.toolResults ?? []).flatMap(extractBooksFromStepResult),
  );
  const seen = new Set<string>();
  return books.filter((book) => {
    if (seen.has(book.id)) return false;
    seen.add(book.id);
    return true;
  });
}

/**
 * Genera una respuesta del chatbot usando el modelo MiMo con tools.
 * Recibe un historial de mensajes UIMessage y retorna el texto y libros.
 */
export async function generateChatbotResponse(
  messages: UIMessage[],
): Promise<ChatResponse> {
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
    const result = await generateText({
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
      toolChoice: "auto",
      temperature: 0.3,
      frequencyPenalty: 0.3,
      presencePenalty: 0.2,
      stopWhen: stepCountIs(5),
    });

    const books = extractBooksFromSteps(result.steps);

    return { success: true, text: result.text, books };
  } catch (error) {
    console.error("[chatbotService] Error:", error);
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudo generar la respuesta del chatbot.",
    };
  }
}
