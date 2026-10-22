import type { Exchange } from "../core/Exchange";
import type { ReconciliationReport } from "./types";

export function reconcileLedger(
  exchange: Exchange,
  totalDeposited: bigint,
): ReconciliationReport {
  let totalAvailable = 0n;
  let totalLocked = 0n;

  for (const col of exchange.ledger.usersCollateral.values()) {
    totalAvailable += col.availableBalance;
    totalLocked += col.marginLocked;
  }

  let totalPositionMargin = 0n;
  for (const positions of exchange.ledger.userPositions.values()) {
    for (const pos of positions) {
      totalPositionMargin += pos.margin;
    }
  }

  let totalRestingMargin = 0n;
  for (const userOrders of exchange.restingOrders.values()) {
    for (const order of userOrders.values()) {
      totalRestingMargin += (order.price * order.quantity) / order.leverage;
    }
  }

  const expectedLocked = totalPositionMargin + totalRestingMargin;
  const lockedMatches = totalLocked === expectedLocked;

  const insuranceFund = exchange.ledger.insuranceFund;
  const feePool = exchange.ledger.feePool;
  const totalHeld = totalAvailable + totalLocked + insuranceFund + feePool;
  const drift = totalHeld - totalDeposited;
  const isBalanced = drift === 0n && lockedMatches;

  return {
    totalDeposited,
    totalAvailable,
    totalLocked,
    insuranceFund,
    feePool,
    totalPositionMargin,
    totalRestingMargin,
    isBalanced,
    drift,
  };
}
