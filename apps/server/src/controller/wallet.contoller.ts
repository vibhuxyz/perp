import type { NextFunction, Request, Response } from "express";
import { colletral } from "../vallidation/wallet.validate";
import { publishCommand } from "../kafka/producer";

export const createWallet = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // @ts-ignore
  const userId = req.userId;

  const result = colletral.safeParse(req.body);

  if (!result.success) {
    return res.status(404).json({
      error: "Validation failed",
      details: result.error.message,
    });
  }

  const { amount } = result.data;

  const commandId = crypto.randomUUID();

  await publishCommand(
    "ONRAMP_DEPOSIT",
    {
      userId: userId.toString(),  
      amount,
    },
    userId.toString(),
  );

  res.json({
    msg: `Balance processing = ${amount}`,
  });
};
