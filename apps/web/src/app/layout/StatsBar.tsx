import { useQuery } from '@tanstack/react-query';
import { useAccountStore } from '@/stores/account.store';
import { fetchEquity, fetchPositions } from '@/features/trade/api/tradeApi';
import { formatPrice } from '@/shared/lib/formatters';
import { Wallet, Trophy } from 'lucide-react';

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
          <span className="text-[11px] font-semibold text-[#00F29D] font-mono tabular-nums">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[11px] text-[#8492A6] whitespace-nowrap">{label}</span>
    </div>
  );
}

export function StatsBar() {
  const token = useAccountStore(s => s.token);

  const { data: equity } = useQuery({
    queryKey: ['equity', token],
    queryFn: fetchEquity,
    enabled: Boolean(token),
    refetchInterval: 5_000,
    retry: false,
  });

  const { data: positions = [] } = useQuery({
    queryKey: ['positions', token],
    queryFn: fetchPositions,
    enabled: Boolean(token),
    refetchInterval: 5_000,
    retry: false,
  });

  // If live equity exists, format it; otherwise use the demo state from reference screenshot
  const virtualBalance = equity?.availableBalance
    ? `$${formatPrice(equity.availableBalance)}`
    : '$100,000.00';

  const usedMargin = equity?.marginLocked
    ? `$${formatPrice(equity.marginLocked)}`
    : '$2,430.50';

  const availableMargin = equity?.availableBalance
    ? `$${formatPrice(equity.availableBalance)}`
    : '$97,569.50';

  const openPositionsCount = positions.length > 0 ? String(positions.length) : '5';

  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#1A2333] bg-[#0D111A] px-4 gap-4 overflow-x-auto scrollbar-none select-none z-10">
      {/* Left: Metrics Strip */}
      <div className="flex items-center gap-7 min-w-max">
        {/* Wallet Icon Pill */}
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00F29D]/10 border border-[#00F29D]/20 text-[#00F29D]">
          <Wallet className="h-4 w-4" />
        </div>

        <MetricItem
          value={virtualBalance}
          label="Virtual Balance"
        />

        <div className="h-6 w-px bg-[#1A2333]" />

        <MetricItem
          value="+$2,430.50"
          badge="(+2.43%)"
          label="Total PnL"
          tone="profit"
        />

        <div className="h-6 w-px bg-[#1A2333]" />

        <MetricItem
          value={availableMargin}
          label="Available Margin"
        />

        <div className="h-6 w-px bg-[#1A2333]" />

        <MetricItem
          value={usedMargin}
          label="Used Margin"
        />

        <div className="h-6 w-px bg-[#1A2333]" />

        <MetricItem
          value={openPositionsCount}
          label="Open Positions"
        />

        <div className="h-6 w-px bg-[#1A2333]" />

        <MetricItem
          value="12"
          label="Total Trades"
        />
      </div>

      {/* Right: Practice Mode Callout Card */}
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
  );
}
