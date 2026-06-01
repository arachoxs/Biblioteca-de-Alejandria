import BookRecommendationCard from "./BookRecommendationCard";

interface BookData {
  titulo: string;
  autor: string;
  categoria: string;
  precio: number;
  copias_disponibles: number;
}

interface ToolPart {
  type?: string;
  output?: Record<string, unknown>;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parts?: any[];
}

function isToolPart(part: unknown): part is ToolPart {
  return typeof part === "object" && part !== null;
}

function extractBooksFromSearch(output: Record<string, unknown>): BookData[] {
  if (!Array.isArray(output.libros)) return [];
  return output.libros as BookData[];
}

function extractBooksFromDetail(output: Record<string, unknown>): BookData[] {
  if (!output.found || !output.libro) return [];
  return [output.libro as BookData];
}

function extractBooksFromRelated(output: Record<string, unknown>): BookData[] {
  if (!output.found || !Array.isArray(output.relaciones)) return [];
  return output.relaciones.flatMap((r) =>
    typeof r === "object" && r !== null && Array.isArray(r.libros)
      ? (r.libros as BookData[])
      : [],
  );
}

function extractBooksFromParts(parts: unknown[]): BookData[] {
  return parts.filter(isToolPart).flatMap((part) => {
    const { type, output } = part;
    if (!output) return [];

    if (type === "tool-searchBooks") return extractBooksFromSearch(output);
    if (type === "tool-getBookDetail") return extractBooksFromDetail(output);
    if (type === "tool-getRelatedBooks") return extractBooksFromRelated(output);
    return [];
  });
}

export default function ChatMessage({ role, content, parts = [] }: ChatMessageProps) {
  const isUser = role === "user";
  const books = isUser ? [] : extractBooksFromParts(parts);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed shadow-sm break-words ${
          isUser
            ? "bg-brand-primary text-white rounded-2xl rounded-br-md"
            : "bg-white text-brand-text border border-brand-accent/15 rounded-2xl rounded-bl-md"
        }`}>
        {content && <p>{content}</p>}

        {books.length > 0 && (
          <div className={`${content ? "mt-2" : ""} space-y-2`}>
            {books.map((book, index) => (
              <BookRecommendationCard
                key={`${book.titulo}-${index}`}
                titulo={book.titulo}
                autor={book.autor}
                categoria={book.categoria}
                precio={book.precio}
                copias_disponibles={book.copias_disponibles}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
