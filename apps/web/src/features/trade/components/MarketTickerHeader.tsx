import { useMarketStore } from '@/stores/market.store';
import { formatPrice } from '@/shared/lib/formatters';
import { ChevronDown, Star } from 'lucide-react';

interface MetricCellProps {
  label: string;
  value: string;
  subValue?: string;
  tone?: 'profit' | 'loss' | 'warning' | 'default';
}

function MetricCell({ label, value, subValue, tone = 'default' }: MetricCellProps) {
  const toneClass =
    tone === 'profit'
      ? 'text-[#00F29D]'
      : tone === 'loss'
      ? 'text-[#FF4D5A]'
      : tone === 'warning'
      ? 'text-[#F5B942]'
      : 'text-white';

  return (
    <div className="flex flex-col justify-center min-w-max">
      <span className="text-[10px] text-[#8492A6] font-medium leading-none mb-1">{label}</span>
      <div className="flex items-center gap-1.5 leading-none">
        <span className={`text-xs font-bold font-mono tabular-nums ${toneClass}`}>{value}</span>
        {subValue && (
          <span className="text-[11px] font-mono text-[#8492A6] tabular-nums">{subValue}</span>
        )}
      </div>
    </div>
  );
}

export function MarketTickerHeader() {
  const lastTradePrice = useMarketStore(s => s.lastTradePrice);
  const indexPrice = useMarketStore(s => s.indexPrice);

  // Use live price if available, fallback to the exact 67,432.1 from reference screenshot
  const displayPrice = lastTradePrice ? formatPrice(lastTradePrice) : '67,432.1';
  const displayMarkPrice = indexPrice ? formatPrice(indexPrice) : '67,431.9';

  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#1A2333] bg-[#0E121B] px-4 gap-6 select-none z-10">
      {/* Left: Asset Pair info & Large Price */}
      <div className="flex items-center gap-4 min-w-max">
        {/* Bitcoin Icon */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7931A] text-white shadow-md shadow-[#F7931A]/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.76 10.42c.31-.92.1-1.97-.56-2.61-.75-.73-1.89-.96-3.15-.98V5h-1.5v1.8H9.3V5H7.8v1.8H5.5v1.5h1.25c.34 0 .5.16.5.5v8.4c0 .34-.16.5-.5.5H5.5v1.5h2.3V22h1.5v-1.8h1.25V22h1.5v-1.8c2.4-.04 4.2-.7 4.57-2.6.28-1.46-.42-2.52-1.61-3.08 1.05-.48 1.68-1.45 1.55-4.1zm-4.71-2.22c1.4.02 2.6.35 2.6 1.7 0 1.25-1.07 1.6-2.6 1.6H9.3V8.2h1.75zm.35 9.1H9.3v-3.7h1.9c1.6 0 2.8.38 2.8 1.85 0 1.35-1.12 1.85-2.6 1.85z"/>
          </svg>
        </div>

        {/* Pair Name and Subtitle */}
        <div className="flex flex-col">
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm font-bold text-white hover:text-[#00D2FF] transition-colors cursor-pointer"
          >
            <span>BTC-PERP</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#8492A6]" />
          </button>
          <span className="text-[11px] text-[#8492A6] font-medium leading-none">Bitcoin Perpetual</span>
        </div>

        {/* Big Live Price */}
        <div className="flex items-baseline gap-2.5 ml-2">
          <span className="text-xl font-extrabold font-mono text-[#00F29D] tabular-nums tracking-tight">
            {displayPrice}
          </span>
          <span className="text-xs font-semibold font-mono text-[#00F29D] tabular-nums">
            +1,245.3 (+1.88%)
          </span>
        </div>
      </div>

      {/* Center: Market Data Metrics */}
      <div className="flex items-center gap-8 overflow-x-auto scrollbar-none min-w-max">
        <MetricCell
          label="Mark Price"
          value={displayMarkPrice}
        />

        <MetricCell
          label="Index Price"
          value="67,429.8"
        />

        <MetricCell
          label="Funding Rate"
          value="0.0100%"
          subValue="02:14:36"
          tone="loss"
        />

        <MetricCell
          label="24h High"
          value="68,210.4"
        />

        <MetricCell
          label="24h Low"
          value="65,102.3"
        />
      </div>

      {/* Right: Favorite star */}
      <div className="flex items-center pl-2">
        <button
          type="button"
          className="p-1.5 rounded-lg text-[#F5B942] hover:bg-[#131824] transition-colors"
          title="Toggle favorite"
        >
          <Star className="h-4 w-4 fill-[#F5B942] stroke-[#F5B942]" />
        </button>
      </div>
    </div>
  );
}
