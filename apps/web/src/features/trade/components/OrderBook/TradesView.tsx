import { formatPrice, formatSize } from '@/shared/lib/formatters';
import type { Trade } from '@/stores/market.store';

export function TradesView({ trades }: { trades: Trade[] }) {
  return (
    <div className="flex flex-col flex-1 p-3 text-xs text-text-secondary font-mono">
      <div className="grid grid-cols-3 pb-2 text-[11px] font-medium border-b border-border-subtle/50">
        <span>Price (USD)</span>
        <span className="text-right">Size (BTC)</span>
        <span className="text-right">Time</span>
      </div>
      <div className="flex flex-col gap-1 pt-2 overflow-y-auto scrollbar-thin">
        {trades.length > 0 ? (
          trades.map((t, idx) => (
            <div key={`${t.id}-${idx}`} className="grid grid-cols-3 py-1">
              <span className={t.isUp ? 'text-profit' : 'text-loss'}>${formatPrice(t.price)}</span>
              <span className="text-right text-white">{formatSize(t.size)}</span>
              <span className="text-right text-text-secondary text-[11px]">{t.time}</span>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-[11px] text-text-secondary">No trades recorded yet this session.</div>
        )}
      </div>
    </div>
  );
}
