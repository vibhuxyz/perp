import express from "express";
import { createOrder } from "../controller/order.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";

const router = express();

router.post("/order", AuthMiddleware, createOrder);

export default router;
