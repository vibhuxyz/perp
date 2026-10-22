import express from "express";
import {
  createOrder,
  cancelOrder,
  getOpenOrders,
  getOrderHistory,
  getUserFills,
} from "../controller/order.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/order", authMiddleware, createOrder);
router.post("/orders", authMiddleware, createOrder);
router.post("/orders/:id/cancel", authMiddleware, cancelOrder);
router.post("/order/cancel", authMiddleware, cancelOrder);
router.get("/orders/open", authMiddleware, getOpenOrders);
router.get("/orders/history", authMiddleware, getOrderHistory);
router.get("/fills", authMiddleware, getUserFills);

export default router;
