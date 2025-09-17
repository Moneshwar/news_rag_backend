import { Request, Response, Router } from "express";

const healthRouter: Router = Router();

// Health check endpoint
healthRouter.get("/ping", (req: Request, res: Response) => {
  res.json({ message: "pong" });
});

export default healthRouter;
