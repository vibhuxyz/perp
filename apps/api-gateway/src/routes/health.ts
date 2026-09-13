import { Router } from "express";
import { ENV } from "@repo/env-config";

export const healthRouter: Router = Router();

const healthCheck = (_req: any, res: any) => {
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

