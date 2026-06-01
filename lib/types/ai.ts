import type { ActionResponse } from "@/lib/types/common";

export interface BookData {
  titulo: string;
  autor: string;
  categoria: string;
  precio: number;
  copias_disponibles: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  books?: BookData[];
}

export interface ChatResponse extends ActionResponse {
  text?: string;
  books?: BookData[];
}
