import { Router, type Request, type Response } from "express";
import { ENV } from "@repo/env-config";

export const healthRouter: Router = Router();

const healthCheck = (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "api-gateway",
    env: ENV.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
};

healthRouter.get("/health", healthCheck);
healthRouter.get("/gateway-health", healthCheck);
healthRouter.get("/internal/health", healthCheck);

