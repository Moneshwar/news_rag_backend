import { Request, Response, Router } from "express";
import { Document } from "../services/DocumentService.js";
import { documentService } from "../config/services.js";

const documentsRouter: Router = Router();

// Push a single document
documentsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const document: Document = req.body;

    // Validate required fields
    if (!document.id || !document.title || !document.content) {
      return res.status(400).json({
        error: "Missing required fields: id, title, content",
      });
    }

    console.log("Pushing document:", document);

    await documentService.pushDocument(document);
    res.status(201).json({
      message: "Document pushed successfully",
      documentId: document.id,
    });
  } catch (error) {
    console.error("Error pushing document:", error);
    res.status(500).json({
      error: "Failed to push document",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Search/retrieve documents based on query
documentsRouter.get("/search", async (req: Request, res: Response) => {
  try {
    const { query, topK = 5 } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        error: "Query parameter is required",
      });
    }

    const results = await documentService.retrieveDocuments(
      query,
      parseInt(topK as string) || 5
    );

    res.json({
      query,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error("Error searching documents:", error);
    res.status(500).json({
      error: "Failed to search documents",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default documentsRouter;
