import type { Ledger } from "../core/Ledger";
import type { Market } from "../types/index";
import { MAINTENANCE_MARGIN_RATIO, MMR_SCALE } from "./config";

export function calculateAccountEquity(
  ledger: Ledger,
  userId: string,
  markPrices: Map<Market, bigint>,
): bigint {
  const col = ledger.usersCollateral.get(userId);
  if (!col) return 0n;

  let equity = col.availableBalance + col.marginLocked;
  const positions = ledger.userPositions.get(userId) ?? [];

  for (const pos of positions) {
    const markPrice = markPrices.get(pos.market) ?? pos.averagePrice;
    const pnl = pos.side === "LONG"
      ? (markPrice - pos.averagePrice) * pos.quantity
      : (pos.averagePrice - markPrice) * pos.quantity;
    equity += pnl;
  }

  return equity;
}

export function calculateTotalMaintenanceMargin(
  ledger: Ledger,
  userId: string,
  markPrices: Map<Market, bigint>,
): bigint {
  const positions = ledger.userPositions.get(userId) ?? [];
  let totalMM = 0n;

  for (const pos of positions) {
    const markPrice = markPrices.get(pos.market) ?? pos.averagePrice;
    const notional = markPrice * pos.quantity;
    const mmr = (notional * MAINTENANCE_MARGIN_RATIO) / MMR_SCALE;
    totalMM += mmr;
  }

  return totalMM;
}

export function isAccountLiquidatable(
  ledger: Ledger,
  userId: string,
  markPrices: Map<Market, bigint>,
): boolean {
  const positions = ledger.userPositions.get(userId) ?? [];
  if (positions.length === 0) return false;

  const equity = calculateAccountEquity(ledger, userId, markPrices);
  const totalMM = calculateTotalMaintenanceMargin(ledger, userId, markPrices);

  return equity <= totalMM;
}
