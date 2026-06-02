import ChatMessage from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "@/lib/types/ai";

interface ChatMessageListProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  error?: Error | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function ChatMessageList({
  messages,
  isLoading,
  error,
  messagesEndRef,
}: ChatMessageListProps) {
  const showLoading =
    isLoading && messages[messages.length - 1]?.role !== "assistant";

  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Mensajes del chat"
      className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0 bg-gradient-to-b from-brand-bg/30 to-white">
      {messages.length === 0 && !showLoading && (
        <div className="chat-message-in">
          <div className="flex justify-start">
            <div className="max-w-[85%] px-4 py-3 text-sm leading-relaxed bg-white text-brand-text border border-brand-accent/15 rounded-2xl rounded-bl-md shadow-sm">
              <p className="mb-1">
                ¡Hola! Soy el asistente de la{" "}
                <span className="font-semibold text-brand-primary">
                  Biblioteca de Alejandría
                </span>.
              </p>
              <p className="text-brand-secondary/70">
                Puedo ayudarte con consultas sobre libros, autores, categorías
                y más. ¿En qué puedo ayudarte?
              </p>
            </div>
          </div>
        </div>
      )}

      {messages.map((message, index) => (
        <div
          key={message.id}
          className="chat-message-in"
          style={{ animationDelay: `${Math.min(index * 30, 150)}ms` }}>
          <ChatMessage
            role={message.role}
            content={message.content}
            books={message.books}
          />
        </div>
      ))}

      {error && (
        <div className="flex justify-center chat-message-in">
          <div className="px-4 py-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl">
            Ocurrió un error al conectar con el asistente. Intenta de nuevo.
          </div>
        </div>
      )}

      {showLoading && (
        <div className="flex justify-start chat-message-in">
          <div className="px-4 py-3 bg-white border border-brand-accent/15 rounded-2xl rounded-bl-md shadow-sm">
            <div className="flex gap-1.5 items-center h-5">
              <span className="w-2 h-2 bg-brand-primary/40 rounded-full chat-dot-1" />
              <span className="w-2 h-2 bg-brand-primary/40 rounded-full chat-dot-2" />
              <span className="w-2 h-2 bg-brand-primary/40 rounded-full chat-dot-3" />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
