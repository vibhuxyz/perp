import { useMarketStore } from '@/stores/market.store';
import { formatPrice } from '@/shared/lib/formatters';
import type { HoverData, CandlestickData } from '../chartData';
import { LegendHover } from './LegendHover';
import { LegendStatic } from './LegendStatic';

export function ChartLegend({
  hoverData,
  lastTradePrice,
  indexPrice,
  effectivePrice,
  latestCandle,
}: {
  hoverData: HoverData | null;
  lastTradePrice: string | null;
  indexPrice: string | null;
  effectivePrice: number;
  latestCandle: CandlestickData | null;
}) {
  const currentMarket = useMarketStore(s => s.currentMarket);
  return (
    <div className="flex items-center gap-4 px-3 py-1.5 text-[11px] font-mono border-b border-border-subtle/50 bg-[#0C1018] text-text-secondary tabular-nums overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-1.5 text-profit shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-profit animate-pulse" />
        <span className="font-bold">{currentMarket}</span>
      </div>

      {hoverData ? (
        <LegendHover hoverData={hoverData} />
      ) : (
        <LegendStatic
          lastTradePrice={lastTradePrice}
          indexPrice={indexPrice}
          effectivePrice={effectivePrice}
          latestCandle={latestCandle}
        />
      )}

      <div className="ml-auto text-text-secondary text-[10px] shrink-0 pl-2">
        Index: <span className="text-profit font-semibold">{indexPrice ? `$${formatPrice(indexPrice)}` : '—'}</span>
      </div>
    </div>
  );
}
