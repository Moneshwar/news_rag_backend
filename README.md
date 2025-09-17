# RAG Chatbot Backend

A powerful RAG (Retrieval-Augmented Generation) chatbot backend that provides real-time news information using advanced AI services and vector search capabilities.

## 🏗️ Architecture Overview

The backend is built with a modular service-oriented architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                        Express.js API                       │
├─────────────────────────────────────────────────────────────┤
│                          Routes                             │
│  • /health - Health check endpoint                         │
│  • /documents - Document management (upload/search)        │
│  • /chat - Chat conversation endpoints                     │
├─────────────────────────────────────────────────────────────┤
│                        Services Layer                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │  ChatService    │ │ DocumentService │ │ GeminiService │  │
│  │  - Conversation │ │ - Doc ingestion │ │ - AI responses│  │
│  │  - Session mgmt │ │ - Vector search │ │ - Text gen    │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
│                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │ JinaEmbedding   │ │  QdrantService  │ │ RedisService  │  │
│  │ - Text vectors  │ │ - Vector store  │ │ - Caching     │  │
│  │ - Embeddings    │ │ - Similarity    │ │ - Sessions    │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

- **Express.js Server**: RESTful API with CORS support
- **ChatService**: Manages conversation flow and context
- **DocumentService**: Handles document ingestion and vector search
- **GeminiService**: Google's Gemini AI for text generation
- **JinaEmbeddingService**: Creates vector embeddings for semantic search
- **QdrantService**: Vector database for similarity search
- **RedisService**: Caching and session management

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Qdrant vector database
- Redis (optional, for caching)

### Required API Keys

You'll need the following API keys:

- **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Jina API Key**: Get from [Jina AI](https://jina.ai/)
- **Qdrant**: Can use local instance or [Qdrant Cloud](https://cloud.qdrant.io/)

### Installation

1. **Clone and navigate to the backend directory:**

   ```bash
   cd rag-chatbot-backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   cp env.example .env
   ```

   Edit `.env` file with your configuration:

   ```env
   # Server Configuration
   PORT=5000

   # API Keys
   JINA_API_KEY=your_jina_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here

   # Qdrant Configuration
   QDRANT_URL=http://localhost:6333
   QDRANT_API_KEY=your_qdrant_api_key_here  # Optional for local
   ```

4. **Set up Qdrant (choose one option):**

   **Option A: Local Qdrant with Docker**

   ```bash
   docker run -p 6333:6333 qdrant/qdrant
   ```

   **Option B: Qdrant Cloud**

   - Sign up at [Qdrant Cloud](https://cloud.qdrant.io/)
   - Create a cluster and get your URL and API key

5. **Start the development server:**

   ```bash
   npm run dev
   ```

6. **For production:**
   ```bash
   npm run build
   npm start
   ```

The server will start on `http://localhost:5000` (or your configured PORT).

## 📡 API Endpoints

### Health Check

- **GET** `/health` - Server health status

### Document Management

- **POST** `/documents/upload` - Upload documents for ingestion
- **GET** `/documents/search` - Search documents by query

### Chat

- **POST** `/chat/conversation` - Start/continue conversation
- **GET** `/chat/sessions/:sessionId` - Get conversation history
- **DELETE** `/chat/sessions/:sessionId` - Clear conversation

### Example Chat Request

```bash
curl -X POST http://localhost:5000/chat/conversation \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the latest news about technology?",
    "sessionId": "optional-session-id"
  }'
```

## 🛠️ Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run linting (if configured)

### Project Structure

```
src/
├── config/
│   └── services.ts          # Service initialization and configuration
├── routes/
│   ├── index.ts            # Route aggregation
│   ├── health.ts           # Health check routes
│   ├── documents.ts        # Document management routes
│   └── chat.ts             # Chat conversation routes
├── services/
│   ├── ChatService.ts      # Conversation management
│   ├── DocumentService.ts  # Document processing and search
│   ├── GeminiService.ts    # Google Gemini AI integration
│   ├── JinaEmbeddingService.ts # Text embedding generation
│   ├── QdrantService.ts    # Vector database operations
│   └── RedisService.ts     # Caching and session storage
├── types/
│   └── chat.ts             # TypeScript type definitions
├── prompts/
│   ├── isNewsDataRequires.ts        # Prompt templates
│   └── repsondToUserQueryFromNews.ts
└── index.ts                # Application entry point
```

## 🔧 Configuration

### Environment Variables

| Variable         | Required | Description                | Default |
| ---------------- | -------- | -------------------------- | ------- |
| `PORT`           | No       | Server port                | `3000`  |
| `GEMINI_API_KEY` | Yes      | Google Gemini API key      | -       |
| `JINA_API_KEY`   | Yes      | Jina AI API key            | -       |
| `QDRANT_URL`     | Yes      | Qdrant database URL        | -       |
| `QDRANT_API_KEY` | No       | Qdrant API key (for cloud) | -       |

### Service Dependencies

The application initializes services in a specific order:

1. Environment validation
2. Embedding service initialization
3. Vector database connection
4. Document service setup
5. AI service configuration
6. Cache service connection

## 🔍 Features

- **Real-time Chat**: Streaming responses for better UX
- **Vector Search**: Semantic similarity search using embeddings
- **Session Management**: Persistent conversation context
- **Document Ingestion**: Support for various document formats
- **Caching**: Redis-based caching for improved performance
- **Health Monitoring**: Built-in health check endpoints
- **Error Handling**: Comprehensive error handling and logging

## 🚨 Troubleshooting

### Common Issues

1. **Service initialization fails**

   - Check that all required environment variables are set
   - Verify API keys are valid
   - Ensure Qdrant is running and accessible

2. **Qdrant connection errors**

   - Verify Qdrant URL is correct
   - Check if Qdrant service is running
   - For cloud instances, verify API key

3. **Memory issues**

   - Monitor memory usage during document processing
   - Consider increasing Node.js memory limit: `node --max-old-space-size=4096`

4. **Port conflicts**
   - Change PORT in `.env` file
   - Check if another service is using the port
