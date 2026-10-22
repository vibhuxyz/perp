import type { Fill } from "engine";

export interface ClosedPositionRecord {
  id: string;
  userId: string;
  market: string;
  side: "LONG" | "SHORT";
  size: string;
  entryPrice: string;
  closePrice: string;
  realizedPnL: string;
  closedAt: string;
}

export interface StatementItem {
  id: string;
  type: "deposit" | "margin_locked" | "pnl_credit" | "pnl_debit" | "fee" | "funding";
  title: string;
  description: string;
  category: "Added" | "Margin" | "Credit" | "Debit" | "Fee";
  amount: number;
  balance: number;
  status: "Completed" | "Settled";
  refId: string;
  timestamp: string;
}

export const closedPositionsHistory: ClosedPositionRecord[] = [];

export function recordClosedPosition(
  userId: string,
  market: string,
  side: "LONG" | "SHORT",
  size: bigint,
  entryPrice: bigint,
  closePrice: bigint,
  realizedPnL: bigint,
): void {
  closedPositionsHistory.push({
    id: crypto.randomUUID(),
    userId,
    market,
    side,
    size: size.toString(),
    entryPrice: entryPrice.toString(),
    closePrice: closePrice.toString(),
    realizedPnL: realizedPnL.toString(),
    closedAt: new Date().toISOString(),
  });
}

export function buildAccountActivity(
  userId: string,
  userFills: Fill[],
  availableBalance: number,
): StatementItem[] {
  const items: StatementItem[] = [];

  for (const cp of closedPositionsHistory.filter(p => p.userId === userId)) {
    const pnl = Number(cp.realizedPnL);
    items.push({
      id: cp.id,
      type: pnl >= 0 ? "pnl_credit" : "pnl_debit",
      title: `Closed ${cp.market} ${cp.side}`,
      description: `Closed at $${cp.closePrice} (Entry: $${cp.entryPrice})`,
      category: pnl >= 0 ? "Credit" : "Debit",
      amount: pnl,
      balance: availableBalance,
      status: "Settled",
      refId: cp.id.slice(0, 8),
      timestamp: cp.closedAt,
    });
  }

  for (const f of userFills) {
    const notional = Number(f.price * f.quantity);
    const margin = Math.round(notional / Number(f.leverage || 10n));
    items.push({
      id: f.fillId,
      type: "margin_locked",
      title: `Trade ${f.market}`,
      description: `Executed ${f.quantity.toString()} @ $${f.price.toString()}`,
      category: "Margin",
      amount: -margin,
      balance: availableBalance,
      status: "Settled",
      refId: f.fillId.slice(0, 8),
      timestamp: f.createdAt.toISOString(),
    });
  }

  items.push({
    id: `deposit_${userId}`,
    type: "deposit",
    title: "Account Deposit",
    description: "Initial margin deposit",
    category: "Added",
    amount: 10000,
    balance: availableBalance,
    status: "Completed",
    refId: `dep-${userId.slice(0, 6)}`,
    timestamp: new Date().toISOString(),
  });

  return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
