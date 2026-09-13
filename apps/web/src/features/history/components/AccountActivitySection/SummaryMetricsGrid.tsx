import { ArrowDownLeft, Lock, TrendingUp, Receipt, Wallet } from 'lucide-react';

function money(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function SummaryMetricsGrid({
  moneyAdded,
  onRampCount,
  marginUsed,
  realizedPnL,
  feesFunding,
  availableBalance,
}: {
  moneyAdded: number;
  onRampCount: number;
  marginUsed: number;
  realizedPnL: number;
  feesFunding: number;
  availableBalance: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 select-none">
      <div className="flex flex-col justify-between rounded-xl bg-bg-card border border-border-subtle p-3.5 sm:p-4 gap-1 hover:border-[#27354D] transition-colors shadow-xs">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Money Added (Deposits)</span>
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-profit/10 text-profit">
            <ArrowDownLeft className="h-3.5 w-3.5" />
          </div>
        </div>
        <span className="text-lg font-bold font-mono text-profit tabular-nums">+${money(moneyAdded)}</span>
        <span className="text-[11px] text-text-muted">{onRampCount} total on-ramps</span>
      </div>

      <div className="flex flex-col justify-between rounded-xl bg-bg-card border border-border-subtle p-3.5 sm:p-4 gap-1 hover:border-[#27354D] transition-colors shadow-xs">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Margin Used / Locked</span>
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#3B82F6]/10 text-info">
            <Lock className="h-3.5 w-3.5" />
          </div>
        </div>
        <span className="text-lg font-bold font-mono text-info tabular-nums">${money(marginUsed)}</span>
        <span className="text-[11px] text-text-muted">Active position collateral</span>
      </div>

      <div className="flex flex-col justify-between rounded-xl bg-bg-card border border-border-subtle p-3.5 sm:p-4 gap-1 hover:border-[#27354D] transition-colors shadow-xs">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Net Realized PnL</span>
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-profit/10 text-profit">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
        </div>
        <span className="text-lg font-bold font-mono text-profit tabular-nums">
          {realizedPnL >= 0 ? '+' : ''}${money(realizedPnL)}
        </span>
        <span className="text-[11px] text-text-muted">Credited gains net of losses</span>
      </div>

      <div className="flex flex-col justify-between rounded-xl bg-bg-card border border-border-subtle p-3.5 sm:p-4 gap-1 hover:border-[#27354D] transition-colors shadow-xs">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Fees & Funding</span>
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-loss/10 text-loss">
            <Receipt className="h-3.5 w-3.5" />
          </div>
        </div>
        <span className="text-lg font-bold font-mono text-loss tabular-nums">-${money(Math.abs(feesFunding))}</span>
        <span className="text-[11px] text-text-muted">Taker fees & funding basis</span>
      </div>

      <div className="flex flex-col justify-between rounded-xl bg-bg-card border border-border-subtle p-3.5 sm:p-4 gap-1 hover:border-[#27354D] transition-colors shadow-xs">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Net Available Balance</span>
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#7152FF]/10 text-[#A088FF]">
            <Wallet className="h-3.5 w-3.5" />
          </div>
        </div>
        <span className="text-lg font-bold font-mono text-white tabular-nums">${money(availableBalance)}</span>
        <span className="text-[11px] text-profit font-medium">Ready for trading</span>
      </div>
    </div>
  );
}
