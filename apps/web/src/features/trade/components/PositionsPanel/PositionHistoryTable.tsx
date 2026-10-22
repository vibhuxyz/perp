import { useQuery } from '@tanstack/react-query';
import { fetchPositionHistory, type PositionHistoryItem } from '@/features/trade/api/tradeApi';
import { formatPrice } from '@/shared/lib/formatters';
import { MarketIcon } from '../CryptoIcon';

function formatClosedTime(isoString: string): string {
  const d = new Date(isoString);
  return isNaN(d.getTime()) ? isoString : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function PositionHistoryTable({ token }: { token: string }) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['positionHistory', token],
    queryFn: fetchPositionHistory,
    enabled: Boolean(token),
    refetchInterval: 3_000,
  });

  if (isLoading) {
    return <div className="py-12 text-center text-text-muted text-xs font-sans">Loading position history…</div>;
  }

  if (history.length === 0) {
    return (
      <div className="py-14 text-center text-text-muted text-xs font-sans">
        No closed positions yet. Closed or liquidated positions will appear here with realized PnL.
      </div>
    );
  }

  return (
    <table className="w-full text-left text-xs font-mono">
      <thead>
        <tr className="border-b border-border-subtle text-text-secondary text-[11px] font-medium font-sans">
          <th className="px-4 py-2.5">Closed Time</th>
          <th className="px-3 py-2.5">Market</th>
          <th className="px-3 py-2.5">Side</th>
          <th className="px-3 py-2.5">Size</th>
          <th className="px-3 py-2.5">Entry Price</th>
          <th className="px-3 py-2.5">Close Price</th>
          <th className="px-4 py-2.5 text-right">Realized PnL</th>
        </tr>
      </thead>
      <tbody>
        {history.map((p: PositionHistoryItem) => {
          const isLong = p.side === 'LONG';
          const baseAsset = p.market.replace(/-PERP$/i, '');
          const pnlNum = Number(p.realizedPnL);
          const isProfit = pnlNum >= 0;

          return (
            <tr key={p.id} className="border-b border-border-subtle/40 hover:bg-bg-card-hover transition-colors">
              <td className="px-4 py-2.5 text-text-muted text-[11px]">{formatClosedTime(p.closedAt)}</td>
              <td className="px-3 py-2.5 font-bold text-white">
                <div className="flex items-center gap-1.5">
                  <MarketIcon symbol={p.market} className="h-4 w-4" />
                  <span>{p.market}</span>
                </div>
              </td>
              <td className="px-3 py-2.5">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isLong ? 'bg-[#00DA8E]/15 text-[#00DA8E]' : 'bg-loss/15 text-loss'}`}>
                  {p.side}
                </span>
              </td>
              <td className="px-3 py-2.5 text-white">
                {p.size} {baseAsset}
              </td>
              <td className="px-3 py-2.5 text-white">${formatPrice(p.entryPrice)}</td>
              <td className="px-3 py-2.5 text-white">${formatPrice(p.closePrice)}</td>
              <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${isProfit ? 'text-profit' : 'text-loss'}`}>
                {isProfit ? '+' : ''}{pnlNum.toFixed(2)} USD
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
