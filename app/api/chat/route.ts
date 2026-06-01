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

async function parseAndValidateMessages(req: Request): Promise<
  { messages: UIMessage[] } | { error: NextResponse }
> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      error: NextResponse.json(
        { success: false, message: "Request body inválido." },
        { status: 400 },
      ),
    };
  }

  const { messages } = body as { messages: UIMessage[] };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return {
      error: NextResponse.json(
        { success: false, message: "Se requiere un array de mensajes." },
        { status: 400 },
      ),
    };
  }

  if (messages.length > 50) {
    return {
      error: NextResponse.json(
        { success: false, message: "Máximo 50 mensajes por conversación." },
        { status: 400 },
      ),
    };
  }

  return { messages };
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
