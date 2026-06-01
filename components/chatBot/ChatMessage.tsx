import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import BookRecommendationCard from "./BookRecommendationCard";
import type { BookData } from "@/lib/types/ai";

const remarkPlugins = [remarkGfm];

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  books?: BookData[];
}

export default function ChatMessage({ role, content, books = [] }: ChatMessageProps) {
  const isUser = role === "user";
  const displayBooks = isUser ? [] : books;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed shadow-sm break-words ${
          isUser
            ? "bg-brand-primary text-white rounded-2xl rounded-br-md"
            : "bg-white text-brand-text border border-brand-accent/15 rounded-2xl rounded-bl-md"
        }`}>
        {content && (
          <div className="chat-md">
            <Markdown remarkPlugins={remarkPlugins}>{content}</Markdown>
          </div>
        )}

        {displayBooks.length > 0 && (
          <div className={`${content ? "mt-2" : ""} space-y-2`}>
            {displayBooks.map((book, index) => (
              <BookRecommendationCard
                key={`${book.titulo}-${index}`}
                titulo={book.titulo}
                autor={book.autor}
                categoria={book.categoria}
                precio={book.precio}
                copias_disponibles={book.copias_disponibles}
                noticia_id={book.noticia_id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
