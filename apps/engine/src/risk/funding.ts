import type { Ledger } from "../core/Ledger";
import type { Market } from "../types/index";
import { FUNDING_FACTOR, FUNDING_SCALE } from "./config";

export interface FundingPayment {
  userId: string;
  amount: bigint;
}

export function calculateFundingRate(
  markPrice: bigint,
  indexPrice: bigint,
  scale = 10_000n,
): bigint {
  if (indexPrice === 0n) {
    return 0n;
  }
  return ((markPrice - indexPrice) * scale) / indexPrice;
}

export function settleFunding(
  ledger: Ledger,
  market: Market,
  markPrice: bigint,
  indexPrice: bigint,
): FundingPayment[] {
  const premium = markPrice - indexPrice;

  if (premium === 0n) {
    return [];
  }

  const payments: FundingPayment[] = [];

  for (const positions of ledger.userPositions.values()) {
    for (const position of positions) {
      if (position.market !== market) {
        continue;
      }

      const perUnit = (premium * FUNDING_FACTOR) / FUNDING_SCALE;
      const amount = position.side === "LONG"
        ? -(perUnit * position.quantity)
        : perUnit * position.quantity;

      if (amount === 0n) {
        continue;
      }

      const user = ledger.usersCollateral.get(position.userId);
      if (!user) {
        continue;
      }

      user.availableBalance += amount;
      payments.push({ userId: position.userId, amount });
    }
  }

  return payments;
}
