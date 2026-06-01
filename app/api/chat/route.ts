import { NextResponse } from "next/server";
import { generateChatbotResponse } from "@/services/ia/chatbotService";
import type { UIMessage } from "ai";

const CHAT_SOURCE_HEADER = "biblioteca-chatbot";

const VERCEL_PREVIEW_PATTERN =
  /^biblioteca-de-alejandria-[a-z0-9]+(-arachoxs-projects)?\.vercel\.app$/;

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;

  try {
    const originUrl = new URL(origin);
    const hostname = originUrl.hostname;

    if (hostname === "localhost") return true;
    if (VERCEL_PREVIEW_PATTERN.test(hostname)) return true;

    const allowedUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL!);
    return hostname === allowedUrl.hostname;
  } catch {
    return false;
  }
}

function validateRequest(req: Request): { error?: NextResponse } {
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const chatSource = req.headers.get("x-chat-source");
  if (chatSource !== CHAT_SOURCE_HEADER) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return {};
}

function parseBody(body: unknown): { messages?: UIMessage[]; error?: NextResponse } {
  const { messages } = body as { messages: UIMessage[] };
  return { messages };
}

function validationError(message: string): { error: NextResponse } {
  return {
    error: NextResponse.json(
      { success: false, message },
      { status: 400 },
    ),
  };
}

function isInvalidMessagesArray(
  messages: UIMessage[] | undefined,
): boolean {
  if (!messages) return true;
  if (!Array.isArray(messages)) return true;
  return messages.length === 0;
}

function validateMessages(
  messages: UIMessage[] | undefined,
): { messages: UIMessage[] } | { error: NextResponse } {
  if (isInvalidMessagesArray(messages)) {
    return validationError("Se requiere un array de mensajes.");
  }
  if (messages!.length > 50) {
    return validationError("Máximo 50 mensajes por conversación.");
  }
  return { messages: messages! };
}

async function parseAndValidateMessages(req: Request): Promise<
  { messages: UIMessage[] } | { error: NextResponse }
> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return validationError("Request body inválido.");
  }

  const { messages } = parseBody(body);
  return validateMessages(messages);
}

export async function POST(req: Request) {
  const { error: authError } = validateRequest(req);
  if (authError) return authError;

  const result = await parseAndValidateMessages(req);
  if ("error" in result) return result.error;

  const chatResult = await generateChatbotResponse(result.messages);

  if (!chatResult.success) {
    console.error("[api/chat] Generation failed:", {
      message: chatResult.message,
      errors: chatResult.errors,
    });
    return NextResponse.json(
      { success: false, message: chatResult.message },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    message: {
      role: "assistant",
      content: chatResult.text || "",
    },
    books: chatResult.books || [],
  });
}
