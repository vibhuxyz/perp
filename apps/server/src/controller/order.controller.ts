import type { Request, Response } from "express";
import type { Order } from "engine";
import { orderSchema } from "../vallidation/order.validate";
import { exchange, recordFills, broadcastDepth, broadcastTicker, fills } from "../exchange";
import { publishCommand } from "../kafka/producer";

export const createOrder = async (req: Request, res: Response) => {
  const result = orderSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.message,
    });
  }

  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ msg: "user not found" });
  }

  const { market, side, type, quantity, price, leverage } = result.data;

  const parsedQuantity = BigInt(Math.max(1, Math.round(parseFloat(quantity))));
  const parsedPrice = price ? BigInt(Math.round(parseFloat(price))) : 0n;
  const parsedLeverage = leverage ? BigInt(Math.max(1, Math.round(parseFloat(leverage)))) : 1n;

  const order: Order = {
    userId: String(userId),
    orderId: crypto.randomUUID(),
    market,
    side,
    type,
    quantity: parsedQuantity,
    price: parsedPrice,
    leverage: parsedLeverage,
    status: "resting",
    createdAt: new Date(),
  };

  try {
    void publishCommand("PLACE_ORDER", order, order.market);
    const fills = exchange.placeOrder(order);
    recordFills(fills);
    broadcastDepth(market);
    broadcastTicker(market);

    const initialQty = parsedQuantity;
    const remaining = order.quantity;
    const filledQuantity = (initialQty - remaining).toString();
    const status = order.status === "rejected"
      ? "rejected"
      : remaining === 0n
      ? "filled"
      : filledQuantity !== "0"
      ? "partially_filled"
      : order.type === "MARKET"
      ? "cancelled"
      : "resting";

    return res.status(200).json({
      orderId: order.orderId,
      status,
      quantity: initialQty.toString(),
      remainingQuantity: remaining.toString(),
      filledQuantity,
      fills: fills.length,
    });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const orderId = req.params.id ?? req.body.orderId;
  const market = req.body.market ?? "BTC-PERP";

  if (!orderId) {
    return res.status(400).json({ error: "orderId is required" });
  }

  const cancelled = exchange.cancelOrder(market, String(userId), orderId);
  if (!cancelled) {
    return res.status(404).json({ error: "Order not found or already filled" });
  }

  void publishCommand("CANCEL_ORDER", { orderId, userId: String(userId), market }, market);

  broadcastDepth(market);
  broadcastTicker(market);

  return res.status(200).json({
    success: true,
    orderId: cancelled.orderId,
    status: cancelled.status,
  });
};

export const getOpenOrders = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const orders = exchange.getRestingOrders(String(userId));
  return res.status(200).json(
    orders.map(o => ({
      orderId: o.orderId,
      market: o.market,
      side: o.side,
      type: o.type,
      quantity: o.quantity.toString(),
      price: o.price.toString(),
      leverage: o.leverage.toString(),
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
  );
};

export const getOrderHistory = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userFills = fills.filter(f => f.takerUserId === String(userId) || f.makerUserId === String(userId));
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 50), 100);

  return res.status(200).json(
    userFills.slice(-limit).reverse().map(f => ({
      orderId: f.takerUserId === String(userId) ? f.takerOrderId : f.makerOrderId,
      market: f.market,
      price: f.price.toString(),
      quantity: f.quantity.toString(),
      role: f.takerUserId === String(userId) ? "TAKER" : "MAKER",
      status: "filled",
      createdAt: f.createdAt.toISOString(),
    })),
  );
};
