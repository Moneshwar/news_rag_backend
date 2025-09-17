import { JinaEmbeddingService } from "./JinaEmbeddingService.js";
import { QdrantService } from "./qdrantService.js";

export interface Document {
  id: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface DocumentSearchResult {
  id: string;
  score: number;
  document: Document;
}

export class DocumentService {
  private embeddingService: JinaEmbeddingService;
  private qdrantService: QdrantService;
  private collectionName: string;

  constructor(
    embeddingService: JinaEmbeddingService,
    qdrantService: QdrantService,
    collectionName: string = "news_articles"
  ) {
    this.embeddingService = embeddingService;
    this.qdrantService = qdrantService;
    this.collectionName = collectionName;
  }

  /**
   * Initialize the document collection in Qdrant
   */
  async initialize(): Promise<void> {
    await this.qdrantService.initCollection(this.collectionName, 768);
  }

  /**
   * Push a document to Qdrant after generating its vector embedding
   */
  async pushDocument(document: Document): Promise<void> {
    try {
      // Combine title and content for embedding generation
      const textToEmbed = `${document.title}\n\n${document.content}`;

      // Generate embedding using Gemini
      const embeddings = await this.embeddingService.getDocumentEmbedding(
        textToEmbed
      );
      console.log("Embeddings:", embeddings);
      if (!embeddings || embeddings.length === 0) {
        throw new Error("Failed to generate embedding for document");
      }

      const vector = embeddings[0];
      if (!vector) {
        throw new Error("Invalid embedding vector received");
      }
      console.log("Vector:", vector);
      // Create document payload with metadata
      const payload = {
        id: document.id,
        title: document.title,
        content: document.content,
        metadata: document.metadata || {},
        timestamp: document.timestamp || new Date(),
      };

      // Store in Qdrant
      await this.qdrantService.addDocuments([
        {
          id: this.generateNumericId(document.id),
          vector: vector as number[],
          payload: payload,
        },
      ]);

      console.log(`Successfully pushed document: ${document.id}`);
    } catch (error) {
      console.error(`Error pushing document ${document.id}:`, error);
      throw error;
    }
  }

  /**
   * Push multiple documents in batch
   */
  async pushDocuments(documents: Document[]): Promise<void> {
    const batchSize = 10; // Process in batches to avoid overwhelming the services

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const promises = batch.map((doc) => this.pushDocument(doc));

      try {
        await Promise.all(promises);
        console.log(
          `Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            documents.length / batchSize
          )}`
        );
      } catch (error) {
        console.error(`Error processing batch starting at index ${i}:`, error);
        throw error;
      }
    }
  }

  /**
   * Retrieve documents based on a query
   */
  async retrieveDocuments(
    query: string,
    topK: number = 5
  ): Promise<DocumentSearchResult[]> {
    try {
      // Generate query embedding
      const queryEmbeddings = await this.embeddingService.getQueryEmbedding(
        query
      );

      if (!queryEmbeddings || queryEmbeddings.length === 0) {
        throw new Error("Failed to generate embedding for query");
      }

      const queryVector = queryEmbeddings[0];
      if (!queryVector) {
        throw new Error("Invalid query embedding vector received");
      }

      // Search in Qdrant
      const searchResults = await this.qdrantService.searchDocuments(
        queryVector as number[],
        topK
      );

      // Filter by score threshold and format results
      const results: DocumentSearchResult[] = searchResults.map((result) => ({
        id: result.payload?.id as string,
        score: result.score,
        document: {
          id: result.payload?.id as string,
          title: result.payload?.title as string,
          content: result.payload?.content as string,
          metadata: result.payload?.metadata as Record<string, any>,
          timestamp: new Date(result.payload?.timestamp as string),
        },
      }));

      console.log(
        `Retrieved ${results.length} documents for query: "${query}"`
      );
      return results;
    } catch (error) {
      console.error(`Error retrieving documents for query "${query}":`, error);
      throw error;
    }
  }

  /**
   * Generate a numeric ID from string ID for Qdrant
   * Qdrant requires numeric IDs, so we'll use a simple hash function
   */
  private generateNumericId(stringId: string): number {
    let hash = 0;
    for (let i = 0; i < stringId.length; i++) {
      const char = stringId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
