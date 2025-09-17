export interface JinaEmbedding {
  embedding: number[];
  index: number;
}

export interface JinaEmbeddingResponse {
  model: string;
  object: string;
  usage: {
    total_tokens: number;
    prompt_tokens: number;
  };
  data: JinaEmbedding[];
}

export class JinaEmbeddingService {
  private apiKey: string;
  private model: string;
  private readonly baseUrl: string = "https://api.jina.ai/v1/embeddings";
  private outputDimensionality: number;
  constructor(
    apiKey: string,
    model: string = "jina-embeddings-v3",
    outputDimensionality: number = 768
  ) {
    if (!apiKey) throw new Error("JINA_API_KEY is required");
    this.apiKey = apiKey;
    this.model = model;
    this.outputDimensionality = outputDimensionality;
  }

  /**
   * Generate embeddings for documents (to store in DB).
   */
  async getDocumentEmbedding(text: string): Promise<number[][]> {
    const response = await this.generateEmbedding(text, "retrieval.passage");
    return response.data.map((item) => item.embedding);
  }

  /**
   * Generate embeddings for queries (to search).
   */
  async getQueryEmbedding(text: string): Promise<number[][]> {
    const response = await this.generateEmbedding(text, "retrieval.query");
    return response.data.map((item) => item.embedding);
  }

  /**
   * Private method to generate embeddings using Jina API
   */
  private async generateEmbedding(
    text: string,
    task: string = "retrieval.passage"
  ): Promise<JinaEmbeddingResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: [text],
          dimensions: this.outputDimensionality,
          task: task,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Jina API error: ${response.status} - ${errorText}`);
      }

      const data: JinaEmbeddingResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate Jina embedding: ${error.message}`);
      }
      throw new Error("Failed to generate Jina embedding: Unknown error");
    }
  }
}
