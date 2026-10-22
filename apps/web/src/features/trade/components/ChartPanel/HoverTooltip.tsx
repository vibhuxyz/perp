import { useMarketStore } from '@/stores/market.store';
import { formatPrice } from '@/shared/lib/formatters';
import type { HoverData } from '../chartData';

export function HoverTooltip({ hoverData }: { hoverData: HoverData }) {
  const currentMarket = useMarketStore(s => s.currentMarket);
  const sign = (n: number) => (n >= 0 ? '+' : '');
  const closeColor = hoverData.isUp ? 'text-profit' : 'text-loss';

  return (
    <div
      className="absolute pointer-events-none z-30 bg-[#0C1018]/95 border border-[#1E293B] shadow-2xl rounded-xl p-3 backdrop-blur-md text-xs font-mono select-none flex flex-col gap-2 min-w-[210px] transition-all duration-75"
      style={{ left: `${hoverData.x}px`, top: `${hoverData.y}px` }}
    >
      <div className="flex items-center justify-between text-[11px] text-text-secondary border-b border-border-subtle pb-1.5 font-sans">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-profit" />
          <span className="font-bold text-white">{currentMarket}</span>
        </div>
        <span className="text-[10px] font-mono">{hoverData.time}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-text-secondary font-sans">Open:</span>
          <span className="text-white tabular-nums">${formatPrice(hoverData.open)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-text-secondary font-sans">High:</span>
          <span className="text-profit tabular-nums font-semibold">${formatPrice(hoverData.high)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-text-secondary font-sans">Low:</span>
          <span className="text-loss tabular-nums font-semibold">${formatPrice(hoverData.low)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-text-secondary font-sans">Close:</span>
          <span className={`tabular-nums font-bold ${closeColor}`}>${formatPrice(hoverData.close)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border-subtle pt-1.5 text-[11px]">
        <div className="flex items-center gap-1">
          <span className="text-text-secondary font-sans">Volume:</span>
          <span className="text-white font-semibold tabular-nums">{hoverData.volume.toFixed(2)} BTC</span>
        </div>
        <div className={`font-bold tabular-nums ${closeColor}`}>
          {sign(hoverData.change)}
          {hoverData.change.toFixed(1)} ({sign(hoverData.changePct)}
          {hoverData.changePct.toFixed(2)}%)
        </div>
      </div>
    </div>
  );
}
