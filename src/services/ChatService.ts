import { Content } from "@google/genai";
import { isNewsDataRequiresPrompt } from "../prompts/isNewsDataRequires";
import { DocumentSearchResult, DocumentService } from "./DocumentService";
import { GeminiService } from "./GeminiService";
import { RedisService } from "./RedisService";
import { respondToUserQueryFromNewsPrompt } from "../prompts/repsondToUserQueryFromNews";
import {
  ChatStreamResponse,
  ContinueChatStreamResponse,
  NewsDataRequiredResponse,
  ConversationHistory,
} from "../types/chat";

export class ChatService {
  private documentService: DocumentService;
  private geminiService: GeminiService;
  private redisService: RedisService;

  constructor(
    documentService: DocumentService,
    geminiService: GeminiService,
    redisService: RedisService
  ) {
    this.documentService = documentService;
    this.geminiService = geminiService;
    this.redisService = redisService;
  }

  async startChatStream(
    query: string,
    onChunk: (chunk: string) => void
  ): Promise<ChatStreamResponse> {
    try {
      const sessionId = this.generateSessionId();
      const newsDataCheck = await this.checkIfNewsDataRequired(query);

      if (!newsDataCheck.is_data_required) {
        return await this.handleNonNewsQuery(
          query,
          sessionId,
          newsDataCheck.response,
          onChunk
        );
      }

      return await this.handleNewsQuery(query, sessionId, onChunk);
    } catch (error) {
      console.error("Error in startChatStream:", error);
      throw new Error("Failed to start chat stream");
    }
  }

  async continueChatStream(
    query: string,
    sessionId: string,
    onChunk: (chunk: string) => void
  ): Promise<ContinueChatStreamResponse> {
    try {
      const conversation = await this.getConversationHistory(sessionId);
      const newsDataCheck = await this.checkIfNewsDataRequired(query);

      if (!newsDataCheck.is_data_required) {
        return await this.handleContinueNonNewsQuery(
          query,
          sessionId,
          conversation,
          newsDataCheck.response,
          onChunk
        );
      }

      return await this.handleContinueNewsQuery(
        query,
        sessionId,
        conversation,
        onChunk
      );
    } catch (error) {
      console.error("Error in continueChatStream:", error);
      throw new Error("Failed to continue chat stream");
    }
  }

  // Private helper methods
  private generateSessionId(): string {
    return new Date().getTime().toString();
  }

  private async handleNonNewsQuery(
    query: string,
    sessionId: string,
    response: string,
    onChunk: (chunk: string) => void
  ): Promise<ChatStreamResponse> {
    onChunk(response);
    const conversation = this.createConversation(query, response);
    await this.storeConversation(sessionId, conversation);
    return { sessionId, fullResponse: response };
  }

  private async handleNewsQuery(
    query: string,
    sessionId: string,
    onChunk: (chunk: string) => void
  ): Promise<ChatStreamResponse> {
    const newsData = await this.retrieveNewsData(query);
    const prompt = respondToUserQueryFromNewsPrompt(query, newsData);
    const conversation: Content[] = [
      { role: "user", parts: [{ text: prompt }] },
    ];

    const response = await this.geminiService.generateResponse(
      conversation,
      onChunk
    );
    const conversationToStore = this.createConversation(query, response);
    await this.storeConversation(sessionId, conversationToStore);

    return { sessionId, fullResponse: response };
  }

  private async handleContinueNonNewsQuery(
    query: string,
    sessionId: string,
    conversation: ConversationHistory,
    response: string,
    onChunk: (chunk: string) => void
  ): Promise<ContinueChatStreamResponse> {
    onChunk(response);
    this.addToConversation(conversation, query, response);
    await this.storeConversation(sessionId, conversation);
    return { fullResponse: response };
  }

  private async handleContinueNewsQuery(
    query: string,
    sessionId: string,
    conversation: ConversationHistory,
    onChunk: (chunk: string) => void
  ): Promise<ContinueChatStreamResponse> {
    conversation.push({ role: "user", parts: [{ text: query }] });

    const newsData = await this.retrieveNewsData(query);
    const prompt = respondToUserQueryFromNewsPrompt(query, newsData);

    const conversationWithContext = [
      ...conversation.slice(0, -1),
      { role: "user", parts: [{ text: prompt }] },
    ];

    const response = await this.geminiService.generateResponse(
      conversationWithContext,
      onChunk
    );
    conversation.push({ role: "assistant", parts: [{ text: response }] });
    await this.storeConversation(sessionId, conversation);

    return { fullResponse: response };
  }

  private createConversation(
    query: string,
    response: string
  ): ConversationHistory {
    return [
      { role: "user", parts: [{ text: query }] },
      { role: "assistant", parts: [{ text: response }] },
    ];
  }

  private addToConversation(
    conversation: ConversationHistory,
    query: string,
    response: string
  ): void {
    conversation.push(
      { role: "user", parts: [{ text: query }] },
      { role: "assistant", parts: [{ text: response }] }
    );
  }

  async getConversationHistory(
    sessionId: string
  ): Promise<ConversationHistory> {
    const data = await this.redisService.get(sessionId);
    return JSON.parse(data || "[]");
  }

  private async storeConversation(
    sessionId: string,
    conversation: ConversationHistory
  ): Promise<void> {
    await this.redisService.set(sessionId, JSON.stringify(conversation));
  }

  private async checkIfNewsDataRequired(
    query: string
  ): Promise<NewsDataRequiredResponse> {
    const prompt = isNewsDataRequiresPrompt(query);
    const response = await this.geminiService.generateSimpleResponse([
      { role: "user", parts: [{ text: prompt }] },
    ]);
    return JSON.parse(response.replace(/```json/g, "").replace(/```/g, ""));
  }

  private async retrieveNewsData(
    query: string
  ): Promise<DocumentSearchResult[]> {
    return await this.documentService.retrieveDocuments(query, 10);
  }
}
