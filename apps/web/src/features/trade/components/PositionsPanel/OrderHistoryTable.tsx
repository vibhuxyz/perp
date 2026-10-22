import { useQuery } from '@tanstack/react-query';
import { fetchOrderHistory, type OrderHistoryItem } from '@/features/trade/api/tradeApi';
import { formatPrice } from '@/shared/lib/formatters';
import { MarketIcon } from '../CryptoIcon';
import { StatusBadge } from './StatusBadge';

function formatOrderTime(isoString: string): string {
  const d = new Date(isoString);
  return isNaN(d.getTime()) ? isoString : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function OrderHistoryTable({ token }: { token: string }) {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orderHistory', token],
    queryFn: fetchOrderHistory,
    enabled: Boolean(token),
    refetchInterval: 3_000,
  });

  if (isLoading) {
    return <div className="py-12 text-center text-text-muted text-xs font-sans">Loading order history…</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="py-14 text-center text-text-muted text-xs font-sans">
        No orders placed yet. Orders submitted through the order ticket will appear here.
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
          <th className="px-3 py-2.5">Type</th>
          <th className="px-3 py-2.5">Price</th>
          <th className="px-3 py-2.5">Size</th>
          <th className="px-3 py-2.5">Filled</th>
          <th className="px-4 py-2.5 text-right">Status</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o: OrderHistoryItem) => {
          const isLong = o.side === 'LONG';
          const baseAsset = o.market.replace(/-PERP$/i, '');
          const filled = o.filledQuantity ?? (o.status === 'filled' ? o.quantity : '0');

          return (
            <tr key={o.orderId} className="border-b border-border-subtle/40 hover:bg-bg-card-hover transition-colors">
              <td className="px-4 py-2.5 text-text-muted text-[11px]">{formatOrderTime(o.createdAt)}</td>
              <td className="px-3 py-2.5 font-bold text-white">
                <div className="flex items-center gap-1.5">
                  <MarketIcon symbol={o.market} className="h-4 w-4" />
                  <span>{o.market}</span>
                </div>
              </td>
              <td className="px-3 py-2.5">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isLong ? 'bg-[#00DA8E]/15 text-[#00DA8E]' : 'bg-loss/15 text-loss'}`}>
                  {o.side}
                </span>
              </td>
              <td className="px-3 py-2.5 text-text-secondary">{o.type}</td>
              <td className="px-3 py-2.5 text-white">${formatPrice(o.price)}</td>
              <td className="px-3 py-2.5 text-white">
                {o.quantity} {baseAsset}
              </td>
              <td className="px-3 py-2.5 text-text-secondary">
                {filled} {baseAsset}
              </td>
              <td className="px-4 py-2.5 text-right">
                <StatusBadge status={o.status} filledQuantity={filled} quantity={o.quantity} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
