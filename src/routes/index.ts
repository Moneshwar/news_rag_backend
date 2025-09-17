import { Router } from "express";
import healthRouter from "./health.js";
import documentsRouter from "./documents.js";
import chatRouter from "./chat.js";

const router: Router = Router();

// Mount route modules
router.use("/", healthRouter);
router.use("/documents", documentsRouter);
router.use("/chat", chatRouter);

export default router;
