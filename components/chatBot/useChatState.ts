"use client";

import { useState, useRef, useCallback } from "react";
import type { ChatMessage, BookData } from "@/lib/types/ai";

function buildUIMessages(
  previousMessages: ChatMessage[],
  userMessage: ChatMessage,
) {
  return [
    ...previousMessages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      parts: [{ type: "text" as const, text: m.content }],
    })),
    {
      id: userMessage.id,
      role: "user" as const,
      parts: [{ type: "text" as const, text: userMessage.content }],
    },
  ];
}

async function fetchChatResponse(
  uiMessages: ReturnType<typeof buildUIMessages>,
  signal: AbortSignal,
): Promise<{ content: string; books: BookData[] }> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Chat-Source": "biblioteca-chatbot",
    },
    body: JSON.stringify({ messages: uiMessages }),
    signal,
  });

  if (!response.ok) {
    throw new Error("Error al obtener respuesta del asistente");
  }

  const data = await response.json();

  if (!data.success || !data.message) {
    throw new Error(data.message || "Error al obtener respuesta");
  }

  return { content: data.message.content, books: data.books || [] };
}

export function useChatState() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (input: string, previousMessages: ChatMessage[]) => {
      const trimmed = input.trim();
      if (!trimmed || isLoading) return false;

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const uiMessages = buildUIMessages(previousMessages, userMessage);
        const { content, books } = await fetchChatResponse(
          uiMessages,
          abortControllerRef.current.signal,
        );

        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content, books },
        ]);
        return true;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return false;
        setError(err instanceof Error ? err : new Error("Error desconocido"));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading],
  );

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { messages, isLoading, error, sendMessage, abort };
}
