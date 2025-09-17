import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeServices } from "./config/services.js";
import router from "./routes/index.js";

dotenv.config();

async function startServer() {
  try {
    // Initialize services first
    console.log("🔧 Initializing services...");
    await initializeServices();
    console.log("✅ All services initialized successfully");

    const app: Application = express();

    app.use(
      cors({
        origin: ["https://news-rag-frontend-1.onrender.com"],
        credentials: true,
      })
    );
    app.use(express.json());

    // Routes (services are now initialized)
    app.use("", router);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
