import type { Ledger } from "../core/Ledger";
import type { Market } from "../types/index";
import { FUNDING_FACTOR, FUNDING_SCALE } from "./config";

export interface FundingPayment {
  userId: string;
  amount: bigint;
}

/**
 * Pays the premium between our book and the index: when the perp trades above the index
 * longs pay shorts, and below, shorts pay longs. It is the spring that ties a perpetual
 * to the underlying, since nothing expires to force convergence.
 *
 * notional * (mark - index) / index reduces to quantity * (mark - index), so there is no
 * division to truncate here beyond the damping factor.
 *
 * Long and short open interest are equal while every fill creates both sides, so payments
 * net to zero. They stop netting once liquidations start skipping the counterparty update.
 */
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

      const user = ledger.usersCollateral.get(position.userId)!;
      user.availableBalance += amount;
      payments.push({ userId: position.userId, amount });
    }
  }

  return payments;
}
