import { Content, GoogleGenAI } from "@google/genai";

export class GeminiService {
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateResponse(
    contents: Content[],
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    try {
      console.log("Generating response from Gemini...");
      const response = await this.client.models.generateContentStream({
        model: "gemini-2.0-flash",
        contents: contents,
      });

      let responseText = "";

      for await (const chunk of response) {
        const chunkText = chunk.text || "";
        responseText += chunkText;

        // Stream the response to frontend if callback provided
        if (onChunk && chunkText) {
          onChunk(chunkText);
        }
      }

      return responseText;
    } catch (error) {
      console.error("Error generating response from Gemini:", error);
      throw new Error("Failed to generate response from Gemini AI");
    }
  }

  async generateSimpleResponse(contents: Content[]): Promise<string> {
    try {
      const response = await this.client.models.generateContent({
        model: "gemini-2.0-flash",
        contents: contents,
      });

      return response.text || "";
    } catch (error) {
      console.error("Error generating simple response from Gemini:", error);
      throw new Error("Failed to generate response from Gemini AI");
    }
  }
}
