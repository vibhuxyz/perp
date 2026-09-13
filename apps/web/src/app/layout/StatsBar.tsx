import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccountStore } from '@/stores/account.store';
import { useMarketStore } from '@/stores/market.store';
import { fetchEquity, fetchPositions } from '@/features/trade/api/tradeApi';
import { formatPrice, formatSigned } from '@/shared/lib/formatters';
import { unrealisedPnl } from '@/shared/lib/decimal';
import { Wallet, Trophy, Plus } from 'lucide-react';
import { AddMoneyModal } from '@/features/trade/components/AddMoneyModal';
import Decimal from 'decimal.js';

interface MetricItemProps {
  value: string;
  label: string;
  tone?: 'profit' | 'loss' | 'default';
  badge?: string;
}

function MetricItem({ value, label, tone = 'default', badge }: MetricItemProps) {
  const colorClass =
    tone === 'profit'
      ? 'text-[#00F29D]'
      : tone === 'loss'
      ? 'text-[#FF4D5A]'
      : 'text-white';

  return (
    <div className="flex flex-col justify-center min-w-max">
      <div className="flex items-center gap-1.5">
        <span className={`text-sm font-bold tabular-nums font-mono ${colorClass}`}>{value}</span>
        {badge && (
          <span className={`text-[11px] font-semibold font-mono tabular-nums ${colorClass}`}>
            {badge}
          </span>
        )}
      </div>
      <span className="text-[11px] text-[#8492A6] whitespace-nowrap">{label}</span>
    </div>
  );
}

function computePnl(
  positions: Array<{ side: 'LONG' | 'SHORT'; averagePrice: string; quantity: string }>,
  markPrice: string | null
) {
  if (!markPrice || positions.length === 0) {
    return { display: '$0.00', tone: 'default' as const };
  }
  const total = positions.reduce((acc, pos) => {
    return acc.plus(unrealisedPnl(pos.side, pos.averagePrice, markPrice, pos.quantity));
  }, new Decimal(0));

  const tone =
    total.isPositive() && !total.isZero()
      ? ('profit' as const)
      : total.isNegative()
      ? ('loss' as const)
      : ('default' as const);

  return { display: `${formatSigned(total)} USD`, tone };
}

export function StatsBar() {
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const token = useAccountStore((s) => s.token);
  const markPrice = useMarketStore((s) => s.indexPrice);
  const trades = useMarketStore((s) => s.trades);
  const isAuthenticated = Boolean(token);

  const { data: equity } = useQuery({
    queryKey: ['equity', token],
    queryFn: fetchEquity,
    enabled: isAuthenticated,
    refetchInterval: 2_000,
    retry: false,
  });

  const { data: positions = [] } = useQuery({
    queryKey: ['positions', token],
    queryFn: fetchPositions,
    enabled: isAuthenticated,
    refetchInterval: 2_000,
    retry: false,
  });

  if (!isAuthenticated) {
    return null;
  }

  const { display: pnlDisplay, tone: totalPnlTone } = computePnl(positions, markPrice);

  const virtualBalance = equity ? `$${formatPrice(equity.availableBalance)}` : '$0.00';
  const availableMargin = equity ? `$${formatPrice(equity.availableBalance)}` : '$0.00';
  const usedMargin = equity ? `$${formatPrice(equity.marginLocked)}` : '$0.00';

  return (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#1A2333] bg-[#0D111A] px-4 gap-4 overflow-x-auto scrollbar-none select-none z-10">
        {/* Left: Metrics Strip */}
        <div className="flex items-center gap-7 min-w-max">
          {/* Wallet Icon Pill */}
          <button
            type="button"
            onClick={() => setIsDepositOpen(true)}
            title="Add practice money"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00F29D]/10 border border-[#00F29D]/20 text-[#00F29D] hover:bg-[#00F29D]/20 transition-all cursor-pointer"
          >
            <Wallet className="h-4 w-4" />
          </button>

          <MetricItem value={virtualBalance} label="Virtual Balance" />

          <div className="h-6 w-px bg-[#1A2333]" />

          <MetricItem value={pnlDisplay} label="Total PnL" tone={totalPnlTone} />

          <div className="h-6 w-px bg-[#1A2333]" />

          <MetricItem value={availableMargin} label="Available Margin" />

          <div className="h-6 w-px bg-[#1A2333]" />

          <MetricItem value={usedMargin} label="Used Margin" />

          <div className="h-6 w-px bg-[#1A2333]" />

          <MetricItem value={String(positions.length)} label="Open Positions" />

          <div className="h-6 w-px bg-[#1A2333]" />

          <MetricItem value={String(trades.length)} label="Fills & Trades" />
        </div>

        {/* Right side: Add Money Button + Practice Mode Card */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Add Money Button */}
          <button
            type="button"
            onClick={() => setIsDepositOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#7152FF] hover:bg-[#6042EE] text-white px-3.5 py-1.5 text-xs font-semibold shadow-md shadow-[#7152FF]/20 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Money</span>
          </button>

          {/* Practice Mode Callout Card */}
          <div className="flex items-center gap-3 rounded-xl border border-[#1A2333] bg-[#111622] px-3.5 py-1.5 shrink-0 shadow-xs">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00F29D]/10 text-[#00F29D]">
              <Trophy className="h-4 w-4 text-[#00F29D]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white leading-tight">
                You're in Practice Mode
              </span>
              <span className="text-[11px] text-[#8492A6] leading-tight">
                Trade with virtual money and learn risk-free.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Money Modal */}
      <AddMoneyModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        currentBalance={virtualBalance}
      />
    </>
  );
}
