import {
  SUPPORTED_MARKETS,
  MARKET_DETAILS,
  type SupportedMarket,
} from '@/stores/market.store';
import { Check } from 'lucide-react';

export function MarketIcon({ symbol }: { symbol: SupportedMarket }) {
  const meta = MARKET_DETAILS[symbol];
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full text-white font-bold text-xs shadow-md"
      style={{ backgroundColor: meta.color }}
    >
      {meta.baseAsset.slice(0, 1)}
    </div>
  );
}

export function MarketDropdown({
  currentMarket,
  onSelect,
}: {
  currentMarket: SupportedMarket;
  onSelect: (market: SupportedMarket) => void;
}) {
  return (
    <div className="absolute top-12 left-0 w-64 rounded-xl border border-border-subtle bg-[#0D131F] shadow-2xl z-50 p-2 flex flex-col gap-1">
      <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted px-2.5 py-1">
        Select Market
      </span>
      {SUPPORTED_MARKETS.map(m => {
        const item = MARKET_DETAILS[m];
        const isSelected = m === currentMarket;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onSelect(m)}
            className={`flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
              isSelected
                ? 'bg-bg-card-hover border border-border-subtle text-white'
                : 'hover:bg-[#162032] text-text-secondary'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <MarketIcon symbol={m} />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">{item.symbol}</span>
                <span className="text-[10px] text-text-muted">{item.name}</span>
              </div>
            </div>
            {isSelected && <Check className="h-4 w-4 text-profit" />}
          </button>
        );
      })}
    </div>
  );
}
