import { ArrowDownToLine, Lock, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import type { StatementRecord } from './types';

const BADGE_CONFIG: Record<StatementRecord['type'], { icon: typeof ArrowDownToLine; label: string; classes: string }> = {
  deposit: { icon: ArrowDownToLine, label: 'Added', classes: 'bg-profit/10 border-profit/20 text-profit' },
  margin_locked: { icon: Lock, label: 'Margin', classes: 'bg-info/10 border-info/20 text-info' },
  pnl_credit: { icon: TrendingUp, label: 'Credit', classes: 'bg-profit/10 border-profit/20 text-profit' },
  pnl_debit: { icon: TrendingDown, label: 'Debit', classes: 'bg-loss/10 border-loss/20 text-loss' },
  fee: { icon: Receipt, label: 'Fee', classes: 'bg-[#FFB020]/10 border-[#FFB020]/20 text-[#FFB020]' },
  funding: { icon: Receipt, label: 'Funding', classes: 'bg-[#A78BFA]/10 border-[#A78BFA]/20 text-[#A78BFA]' },
};

export function TypeBadge({ type }: { type: StatementRecord['type'] }) {
  const { icon: Icon, label, classes } = BADGE_CONFIG[type];
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${classes}`}>
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </span>
  );
}
