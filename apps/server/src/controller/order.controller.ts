import type { NextFunction, Request, Response } from "express";
import { orderSchema } from "../vallidation/order.validate";


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

  const {
 market, side, type, quantity, price


  } = result.data;


  //@ts-ignore
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({
      msg:"user not found"
    })
  }

  try {
    await kafkaProducer.send({
      topic: "order.commands",
      messages: [
        {
          key: market, // Partition by market symbol to prevent race conditions
          value: JSON.stringify({
            type: "PLACE_ORDER",
            payload: {
              userId,
              market,
              side,
              type,
              quantity,
              price,
              orderId: Math.random().toString(36).substring(7),
            },
          }),
        },
      ],
    });

    return res.status(200).json({ status: "processing" });
  } catch (error) {
    console.error("Failed to push order to Kafka:", error);
    return res
      .status(500)
      .json({ error: "Internal server error during order placement." });
  }
};
