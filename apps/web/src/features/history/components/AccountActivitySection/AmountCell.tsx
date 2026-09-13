import type { StatementRecord } from './types';

function money(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function AmountCell({ tx }: { tx: StatementRecord }) {
  if (tx.type === 'deposit' || tx.type === 'pnl_credit') {
    return <span className="font-mono font-bold text-profit text-xs sm:text-sm">+ ${money(tx.amount)}</span>;
  }
  if (tx.type === 'margin_locked') {
    return <span className="font-mono font-bold text-info text-xs sm:text-sm">${money(Math.abs(tx.amount))}</span>;
  }
  return <span className="font-mono font-bold text-loss text-xs sm:text-sm">- ${money(Math.abs(tx.amount))}</span>;
}
