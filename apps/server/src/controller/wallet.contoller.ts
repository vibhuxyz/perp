import type { NextFunction, Request, Response } from "express";
import { colletral } from "../vallidation/wallet.validate";
import { exchange } from "../exchange";

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

  const collateral = exchange.deposit(userId.toString(), BigInt(amount));

  res.json({
    availableBalance: collateral.availableBalance.toString(),
    marginLocked: collateral.marginLocked.toString(),
  });
};
