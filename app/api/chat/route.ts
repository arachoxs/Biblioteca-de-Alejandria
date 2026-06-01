import { NextResponse } from "next/server";
import { streamChatbotResponse } from "@/services/ia/chatbotService";
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
    if (hostname === allowedUrl.hostname) return true;

    return false;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const chatSource = req.headers.get("x-chat-source");
  if (chatSource !== CHAT_SOURCE_HEADER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = await streamChatbotResponse(messages);

  if (!result.success || !result.stream) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 },
    );
  }

  return result.stream.toUIMessageStreamResponse();
}
