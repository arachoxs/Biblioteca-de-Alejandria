import type { Output, StreamTextResult, ToolSet } from "ai";
import type { ActionResponse } from "@/lib/types/common";

export type ChatStreamResult = StreamTextResult<ToolSet, Output<string, string, never>>;

export interface ChatStreamResponse extends ActionResponse {
  stream?: ChatStreamResult;
}
