interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed shadow-sm break-words ${
          isUser
            ? "bg-brand-primary text-white rounded-2xl rounded-br-md"
            : "bg-white text-brand-text border border-brand-accent/15 rounded-2xl rounded-bl-md"
        }`}>
        {content}
      </div>
    </div>
  );
}
