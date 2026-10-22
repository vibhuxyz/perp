import type { Ledger } from "../core/Ledger";
import type { Market, Position, Side } from "../types/index";

export interface ADLCandidate {
  userId: string;
  market: Market;
  side: Side;
  quantity: bigint;
  margin: bigint;
  averagePrice: bigint;
  unrealizedPnL: bigint;
  rankingScore: bigint;
}

export interface ADLExecutionResult {
  totalExecutedQty: bigint;
  deleveragedCount: number;
}

export function getADLQueue(
  ledger: Ledger,
  market: Market,
  opposingSide: Side,
  markPrice: bigint,
): ADLCandidate[] {
  const candidates: ADLCandidate[] = [];

  for (const [userId, positions] of ledger.userPositions.entries()) {
    const pos = positions.find(p => p.market === market && p.side === opposingSide);
    if (!pos || pos.quantity === 0n) continue;

    const pnl = pos.side === "LONG"
      ? (markPrice - pos.averagePrice) * pos.quantity
      : (pos.averagePrice - markPrice) * pos.quantity;

    if (pnl <= 0n) continue;

    const margin = pos.margin > 0n ? pos.margin : 1n;
    const rankingScore = (pnl * 10_000n) / margin;

    candidates.push({
      userId,
      market,
      side: pos.side,
      quantity: pos.quantity,
      margin: pos.margin,
      averagePrice: pos.averagePrice,
      unrealizedPnL: pnl,
      rankingScore,
    });
  }

  return candidates.sort((a, b) => Number(b.rankingScore - a.rankingScore));
}

function settleCandidateDeleverage(
  ledger: Ledger,
  pos: Position,
  qtyToClose: bigint,
  bankruptcyPrice: bigint,
): void {
  const pnl = pos.side === "LONG"
    ? (bankruptcyPrice - pos.averagePrice) * qtyToClose
    : (pos.averagePrice - bankruptcyPrice) * qtyToClose;

  const marginFreed = (pos.margin * qtyToClose) / pos.quantity;
  ledger.settlePnL(pos.userId, pnl, marginFreed);

  if (qtyToClose === pos.quantity) {
    ledger.closePosition(pos.userId, pos.market);
    return;
  }

  pos.quantity -= qtyToClose;
  pos.margin -= marginFreed;
  if (pos.totalNotional) {
    pos.totalNotional -= pos.averagePrice * qtyToClose;
  }
}

export function executeADL(
  ledger: Ledger,
  market: Market,
  opposingSide: Side,
  neededQuantity: bigint,
  bankruptcyPrice: bigint,
  markPrice: bigint,
): ADLExecutionResult {
  const queue = getADLQueue(ledger, market, opposingSide, markPrice);
  let remaining = neededQuantity;
  let count = 0;

  for (const candidate of queue) {
    if (remaining === 0n) break;

    const pos = ledger.getPosition(candidate.userId, market);
    if (!pos) continue;

    const qtyToClose = remaining <= pos.quantity ? remaining : pos.quantity;
    settleCandidateDeleverage(ledger, pos, qtyToClose, bankruptcyPrice);

    remaining -= qtyToClose;
    count += 1;
  }

  return {
    totalExecutedQty: neededQuantity - remaining,
    deleveragedCount: count,
  };
}
