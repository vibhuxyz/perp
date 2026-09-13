import { useMarketStore, selectBestBid, selectBestAsk } from '@/stores/market.store';
import { formatPrice } from '@/shared/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import Decimal from 'decimal.js';

interface StatCellProps {
  label: string;
  value: string | null;
  tone?: 'profit' | 'loss' | 'warning' | 'info' | 'default';
  loading?: boolean;
}

function StatCell({ label, value, tone = 'default', loading = false }: StatCellProps) {
  const toneClass = {
    profit:  'text-profit',
    loss:    'text-loss',
    warning: 'text-warning',
    info:    'text-info',
    default: 'text-text-primary',
  }[tone];

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary truncate">
        {label}
      </span>
      {loading ? (
        <Skeleton className="h-3.5 w-16" />
      ) : (
        <span className={`text-xs font-medium tabular-nums ${toneClass} truncate`}>
          {value ?? '—'}
        </span>
      )}
    </div>
  );
}

/**
 * Sub-header bar showing key market metrics below the main header.
 * Metrics are intentionally tappable — in the future each will open
 * a Popover with a plain-English explanation for learners.
 */
export function MarketHeader() {
  const indexPrice = useMarketStore(s => s.indexPrice);
  const bestBid    = useMarketStore(selectBestBid);
  const bestAsk    = useMarketStore(selectBestAsk);

  const spread =
    bestBid && bestAsk
      ? new Decimal(bestAsk).minus(bestBid).toFixed(2)
      : null;

  const isLoading = !indexPrice && !bestBid && !bestAsk;

  return (
    <div className="flex items-center gap-6 overflow-x-auto scrollbar-none border-b border-border-subtle bg-bg-card px-4 py-2 text-xs">
      <StatCell
        label="Mark price"
        value={indexPrice ? `$${formatPrice(indexPrice)}` : null}
        loading={isLoading}
      />
      <StatCell
        label="Best bid"
        value={bestBid ? `$${formatPrice(bestBid)}` : null}
        tone="profit"
        loading={isLoading}
      />
      <StatCell
        label="Best ask"
        value={bestAsk ? `$${formatPrice(bestAsk)}` : null}
        tone="loss"
        loading={isLoading}
      />
      {spread && (
        <StatCell label="Spread" value={`$${spread}`} />
      )}
      {/* Funding rate placeholder */}
      <StatCell label="Funding" value="0.0100%" tone="warning" />
      {/* 24h change placeholder */}
      <StatCell label="24h change" value="+2.34%" tone="profit" />
    </div>
  );
}
