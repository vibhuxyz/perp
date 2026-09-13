import type { NextFunction, Request, Response } from "express";
import type { Order } from "engine";
import { orderSchema } from "../vallidation/order.validate";
import { exchange, recordFills } from "../exchange";

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = orderSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.message,
    });
  }

  //@ts-ignore
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
    const fills = exchange.placeOrder(order);
    recordFills(fills);

    // The book mutates order.quantity down as it fills. A market order never rests,
    // so an unfilled remainder means it was cancelled for want of liquidity.
    const remaining = order.quantity;
    const status = remaining === 0n
      ? "filled"
      : order.type === "MARKET" ? "cancelled" : "resting";

    return res.status(200).json({
      orderId: order.orderId,
      status,
      filledQuantity: (BigInt(quantity) - remaining).toString(),
      fills: fills.length,
    });
  } catch (error) {
    // Insufficient balance and unknown markets both land here.
    return res.status(400).json({ error: (error as Error).message });
  }
};
