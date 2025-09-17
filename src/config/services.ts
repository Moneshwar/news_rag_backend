import dotenv from "dotenv";
import { DocumentService } from "../services/DocumentService.js";
import { JinaEmbeddingService } from "../services/JinaEmbeddingService.js";
import { QdrantService } from "../services/qdrantService.js";
import { GeminiService } from "../services/GeminiService.js";
import { RedisService } from "../services/RedisService.js";

dotenv.config();

// Environment variables
const geminiApiKey = process.env.GEMINI_API_KEY;
const qdrantUrl = process.env.QDRANT_URL || "";
const qdrantApiKey = process.env.QDRANT_API_KEY;
const jinaApiKey = process.env.JINA_API_KEY;

// Validate required environment variables
function validateEnvironment(): void {
  if (!geminiApiKey) {
    console.error("❌ GEMINI_API_KEY is required in .env file");
    console.log(
      "📝 Please add GEMINI_API_KEY=your_api_key_here to your .env file"
    );
    process.exit(1);
  }

  if (!jinaApiKey) {
    console.error("❌ JINA_API_KEY is required in .env file");
    console.log(
      "📝 Please add JINA_API_KEY=your_api_key_here to your .env file"
    );
    process.exit(1);
  }
  if (!qdrantUrl) {
    console.error("❌ QDRANT_URL is required in .env file");
    console.log("📝 Please add QDRANT_URL=your_url_here to your .env file");
    process.exit(1);
  }
}

// Initialize services
let embeddingService: JinaEmbeddingService;
let qdrantService: QdrantService;
let documentService: DocumentService;
let geminiService: GeminiService;
let redisService: RedisService;

export async function initializeServices(): Promise<{
  embeddingService: JinaEmbeddingService;
  qdrantService: QdrantService;
  documentService: DocumentService;
  geminiService: GeminiService;
  redisService: RedisService;
}> {
  validateEnvironment();

  try {
    embeddingService = new JinaEmbeddingService(jinaApiKey!);
    qdrantService = new QdrantService(qdrantUrl, qdrantApiKey);
    documentService = new DocumentService(embeddingService, qdrantService);
    geminiService = new GeminiService(geminiApiKey!);
    redisService = new RedisService();

    // Initialize services
    await documentService.initialize();
    await redisService.connect();

    console.log("✅ DocumentService initialized successfully");
    console.log("✅ GeminiService initialized successfully");
    console.log("✅ RedisService initialized successfully");

    return {
      embeddingService,
      qdrantService,
      documentService,
      geminiService,
      redisService,
    };
  } catch (error) {
    console.error("❌ Failed to initialize services:", error);
    process.exit(1);
  }
}

export {
  embeddingService,
  qdrantService,
  documentService,
  geminiService,
  redisService,
};
