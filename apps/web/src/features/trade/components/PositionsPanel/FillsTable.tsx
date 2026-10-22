import { useQuery } from '@tanstack/react-query';
import { fetchUserFills, type UserFill } from '@/features/trade/api/tradeApi';
import { formatPrice } from '@/shared/lib/formatters';
import { MarketIcon } from '../CryptoIcon';

function formatFillTime(isoString: string): string {
  const d = new Date(isoString);
  return isNaN(d.getTime()) ? isoString : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function FillsTable({ token }: { token: string }) {
  const { data: fills = [], isLoading } = useQuery({
    queryKey: ['userFills', token],
    queryFn: fetchUserFills,
    enabled: Boolean(token),
    refetchInterval: 3_000,
  });

  if (isLoading) {
    return <div className="py-12 text-center text-text-muted text-xs font-sans">Loading fills…</div>;
  }

  if (fills.length === 0) {
    return (
      <div className="py-14 text-center text-text-muted text-xs font-sans">
        No execution fills yet. When orders execute against the book, fills will appear here.
      </div>
    );
  }

  return (
    <table className="w-full text-left text-xs font-mono">
      <thead>
        <tr className="border-b border-border-subtle text-text-secondary text-[11px] font-medium font-sans">
          <th className="px-4 py-2.5">Time</th>
          <th className="px-3 py-2.5">Market</th>
          <th className="px-3 py-2.5">Side</th>
          <th className="px-3 py-2.5">Role</th>
          <th className="px-3 py-2.5">Price</th>
          <th className="px-3 py-2.5">Size</th>
          <th className="px-3 py-2.5">Total Value</th>
          <th className="px-4 py-2.5 text-right">Fee</th>
        </tr>
      </thead>
      <tbody>
        {fills.map((f: UserFill) => {
          const isBuy = f.side === 'BUY';
          const baseAsset = f.market.replace(/-PERP$/i, '');
          const totalVal = (Number(f.price) * Number(f.quantity)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

          return (
            <tr key={f.fillId} className="border-b border-border-subtle/40 hover:bg-bg-card-hover transition-colors">
              <td className="px-4 py-2.5 text-text-muted text-[11px]">{formatFillTime(f.createdAt)}</td>
              <td className="px-3 py-2.5 font-bold text-white">
                <div className="flex items-center gap-1.5">
                  <MarketIcon symbol={f.market} className="h-4 w-4" />
                  <span>{f.market}</span>
                </div>
              </td>
              <td className="px-3 py-2.5">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isBuy ? 'bg-[#00DA8E]/15 text-[#00DA8E]' : 'bg-loss/15 text-loss'}`}>
                  {f.side}
                </span>
              </td>
              <td className="px-3 py-2.5 text-text-secondary">{f.role}</td>
              <td className="px-3 py-2.5 text-white">${formatPrice(f.price)}</td>
              <td className="px-3 py-2.5 text-white">
                {f.quantity} {baseAsset}
              </td>
              <td className="px-3 py-2.5 text-white tabular-nums">${totalVal}</td>
              <td className="px-4 py-2.5 text-right text-text-muted">{f.fee ?? '0.00'} USD</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
