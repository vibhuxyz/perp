import { useState, useRef, useEffect } from 'react';
import {
  useMarketStore,
  selectBestBid,
  selectBestAsk,
  MARKET_DETAILS,
  type SupportedMarket,
} from '@/stores/market.store';
import { formatPrice } from '@/shared/lib/formatters';
import { ChevronDown, Star } from 'lucide-react';
import Decimal from 'decimal.js';
import { MarketIcon, MarketDropdown } from './MarketDropdown';

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
      <span className="text-[10px] text-text-secondary font-medium leading-none mb-1">{label}</span>
      <div className="flex items-center gap-1.5 leading-none">
        <span className={`text-xs font-bold font-mono tabular-nums ${toneClass}`}>{value}</span>
        {subValue && (
          <span className="text-[11px] font-mono text-text-secondary tabular-nums">{subValue}</span>
        )}
      </div>
    </div>
  );
}

function computePriceChange(lastTradePrice: string | null, indexPrice: string | null): { display: string; isPositive: boolean } {
  if (!lastTradePrice || !indexPrice) return { display: '—', isPositive: true };
  try {
    const pct = new Decimal(lastTradePrice).minus(indexPrice).div(indexPrice).times(100);
    return { display: `${pct.gte(0) ? '+' : ''}${pct.toFixed(2)}%`, isPositive: pct.gte(0) };
  } catch {
    return { display: '—', isPositive: true };
  }
}

function computeFundingRate(lastTradePrice: string | null, indexPrice: string | null): string {
  if (!lastTradePrice || !indexPrice) return '—';
  try {
    const rate = new Decimal(lastTradePrice).minus(indexPrice).div(indexPrice).times(100);
    return `${rate.abs().toFixed(4)}%`;
  } catch {
    return '—';
  }
}

function getHeaderMetrics(
  lastTradePrice: string | null,
  indexPrice: string | null,
  high24h: string | null,
  low24h: string | null,
  bestBid: string | null,
  bestAsk: string | null,
) {
  const displayPrice = lastTradePrice ? formatPrice(lastTradePrice) : '—';
  const displayMarkPrice = indexPrice ? formatPrice(indexPrice) : '—';
  const highDisplay = high24h ? `$${formatPrice(high24h)}` : '—';
  const lowDisplay = low24h ? `$${formatPrice(low24h)}` : '—';
  const spreadDisplay = bestBid && bestAsk ? `$${new Decimal(bestAsk).minus(bestBid).toFixed(2)}` : '—';
  const { display: changeDisplay, isPositive } = computePriceChange(lastTradePrice, indexPrice);
  const fundingRate = computeFundingRate(lastTradePrice, indexPrice);
  return { displayPrice, displayMarkPrice, highDisplay, lowDisplay, spreadDisplay, changeDisplay, isPositive, fundingRate };
}

function MarketSelector({
  currentMarket,
  onSelect,
}: {
  currentMarket: SupportedMarket;
  onSelect: (m: SupportedMarket) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const meta = MARKET_DETAILS[currentMarket];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-4 min-w-max relative" ref={ref}>
      <MarketIcon symbol={currentMarket} />
      <div className="flex flex-col relative">
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className="flex items-center gap-1.5 text-sm font-bold text-white hover:text-info transition-colors cursor-pointer"
        >
          <span>{meta.symbol}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <span className="text-[11px] text-text-secondary font-medium leading-none">{meta.name}</span>
        {isOpen && (
          <MarketDropdown
            currentMarket={currentMarket}
            onSelect={m => {
              onSelect(m);
              setIsOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

export function MarketTickerHeader() {
  const currentMarket = useMarketStore(s => s.currentMarket);
  const setMarket = useMarketStore(s => s.setMarket);

  const lastTradePrice = useMarketStore(s => s.lastTradePrice);
  const indexPrice = useMarketStore(s => s.indexPrice);
  const high24h = useMarketStore(s => s.high24h);
  const low24h = useMarketStore(s => s.low24h);
  const bestBid = useMarketStore(selectBestBid);
  const bestAsk = useMarketStore(selectBestAsk);

  const metrics = getHeaderMetrics(lastTradePrice, indexPrice, high24h, low24h, bestBid, bestAsk);

  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-border-subtle bg-bg-card px-4 gap-6 select-none z-20 relative">
      <div className="flex items-center gap-4 min-w-max">
        <MarketSelector currentMarket={currentMarket} onSelect={setMarket} />
        <div className="flex items-baseline gap-2.5 ml-2">
          <span className="text-xl font-extrabold font-mono text-profit tabular-nums tracking-tight">
            {metrics.displayPrice !== '—' ? `$${metrics.displayPrice}` : '—'}
          </span>
          <span className={`text-xs font-semibold font-mono tabular-nums ${metrics.isPositive ? 'text-profit' : 'text-loss'}`}>
            {metrics.changeDisplay}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-8 overflow-x-auto scrollbar-none min-w-max">
        <MetricCell label="Mark Price" value={metrics.displayMarkPrice !== '—' ? `$${metrics.displayMarkPrice}` : '—'} />
        <MetricCell label="Index Price" value={metrics.displayMarkPrice !== '—' ? `$${metrics.displayMarkPrice}` : '—'} />
        <MetricCell label="Funding Rate" value={metrics.fundingRate} subValue="every 10s" tone="warning" />
        <MetricCell label="24h High" value={metrics.highDisplay} />
        <MetricCell label="24h Low" value={metrics.lowDisplay} />
        <MetricCell label="Spread" value={metrics.spreadDisplay} />

        <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-border-subtle">
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-card-hover px-2.5 text-xs font-semibold text-text-secondary hover:text-white transition-colors cursor-pointer"
          >
            <Star className="h-3.5 w-3.5" />
            <span>Watchlist</span>
          </button>
        </div>
      </div>
    </div>
  );
}
