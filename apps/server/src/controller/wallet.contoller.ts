import type { Request, Response } from "express";
import { cacheBalance } from "@repo/shared";
import { colletral } from "../vallidation/wallet.validate";
import { exchange } from "../exchange";

export const createWallet = async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: "user not found" });
  }

  const result = colletral.safeParse(req.body);

  if (!result.success) {
    return res.status(404).json({
      error: "Validation failed",
      details: result.error.message,
    });
  }

  const { amount } = result.data;

  const collateral = exchange.deposit(userId.toString(), BigInt(amount));
  await cacheBalance(userId.toString(), {
    availableBalance: collateral.availableBalance.toString(),
    marginLocked: collateral.marginLocked.toString(),
  });

  res.json({
    availableBalance: collateral.availableBalance.toString(),
    marginLocked: collateral.marginLocked.toString(),
  });
};
