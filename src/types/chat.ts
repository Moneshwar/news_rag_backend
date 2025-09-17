import { Content } from "@google/genai";

export interface ChatStreamResponse {
  sessionId: string;
  fullResponse: string;
}

export interface ContinueChatStreamResponse {
  fullResponse: string;
}

export interface NewsDataRequiredResponse {
  is_data_required: boolean;
  response: string;
}

export interface ChatStreamOptions {
  query: string;
  onChunk: (chunk: string) => void;
}

export interface ContinueChatStreamOptions extends ChatStreamOptions {
  sessionId: string;
}

export type ConversationHistory = Content[];

export interface ChatServiceDependencies {
  documentService: any; // Will be properly typed when DocumentService is available
  geminiService: any; // Will be properly typed when GeminiService is available
  redisService: any; // Will be properly typed when RedisService is available
}
