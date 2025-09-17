import { Request, Response, Router } from "express";
import { ChatService } from "../services/ChatService";
import {
  documentService,
  geminiService,
  redisService,
} from "../config/services";

const chatRouter: Router = Router();

// Lazy initialization of ChatService to ensure services are available
function getChatService(): ChatService {
  if (!geminiService || !documentService || !redisService) {
    throw new Error("Services not initialized yet");
  }
  return new ChatService(documentService, geminiService, redisService);
}

// Streaming endpoints
chatRouter.post("/start-stream", async (req: Request, res: Response) => {
  const { query } = req.body;

  // Set headers for Server-Sent Events
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

  try {
    const chatService = getChatService();
    const result = await chatService.startChatStream(query, (chunk: string) => {
      // Send chunk to client via Server-Sent Events
      res.write(
        `data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`
      );
    });

    // Send final message with session ID
    res.write(
      `data: ${JSON.stringify({
        type: "complete",
        sessionId: result.sessionId,
        fullResponse: result.fullResponse,
      })}\n\n`
    );

    res.end();
  } catch (error) {
    console.error("Error in start-stream:", error);
    res.write(
      `data: ${JSON.stringify({
        type: "error",
        message: "Failed to generate response",
      })}\n\n`
    );
    res.end();
  }
});

chatRouter.post("/continue-stream", async (req: Request, res: Response) => {
  const { query, sessionId } = req.body;

  // Set headers for Server-Sent Events
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

  try {
    const chatService = getChatService();
    const result = await chatService.continueChatStream(
      query,
      sessionId,
      (chunk: string) => {
        // Send chunk to client via Server-Sent Events
        res.write(
          `data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`
        );
      }
    );

    // Send final message
    res.write(
      `data: ${JSON.stringify({
        type: "complete",
        fullResponse: result.fullResponse,
      })}\n\n`
    );

    res.end();
  } catch (error) {
    console.error("Error in continue-stream:", error);
    res.write(
      `data: ${JSON.stringify({
        type: "error",
        message: "Failed to generate response",
      })}\n\n`
    );
    res.end();
  }
});

// Get conversation history
chatRouter.get(
  "/conversation/:sessionId",
  async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    try {
      const chatService = getChatService();
      const conversation = await chatService.getConversationHistory(sessionId);

      res.json({
        success: true,
        sessionId,
        conversation,
      });
    } catch (error) {
      console.error("Error getting conversation:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve conversation",
      });
    }
  }
);

export default chatRouter;
