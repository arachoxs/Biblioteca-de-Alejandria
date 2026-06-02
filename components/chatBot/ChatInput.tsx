import { type RefObject } from "react";
import { SendHorizontal } from "lucide-react";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
}

export default function ChatInput({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  inputRef,
}: ChatInputProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex items-center gap-2.5 px-4 py-3.5 border-t border-brand-accent/10 bg-white/80 backdrop-blur-sm">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="Escribe tu mensaje..."
        disabled={isLoading}
        className="flex-1 px-4 py-2.5 text-sm bg-brand-bg/60 border border-brand-accent/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/30 focus:bg-white placeholder:text-brand-secondary/35 disabled:opacity-50 transition-all duration-200"
      />
      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-primary text-white transition-all duration-200 hover:bg-brand-secondary hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 shadow-sm hover:shadow-md"
        aria-label="Enviar mensaje">
        <SendHorizontal className="w-4.5 h-4.5" />
      </button>
    </form>
  );
}
