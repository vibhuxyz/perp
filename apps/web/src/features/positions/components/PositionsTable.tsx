import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchPositions, type Position, closePosition } from '@/features/trade/api/tradeApi';
import { unrealisedPnl } from '@/shared/lib/decimal';
import { formatPrice, formatSigned, pnlTone } from '@/shared/lib/formatters';
import { useMarketStore } from '@/stores/market.store';
import { useAccountStore } from '@/stores/account.store';
import { cn } from '@/lib/utils';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function PositionRow({
  position,
  markPrice,
}: {
  position: Position;
  markPrice: string | null;
}) {
  const pnl  = markPrice
    ? unrealisedPnl(position.side, position.averagePrice, markPrice, position.quantity)
    : null;
  const tone = pnl ? pnlTone(pnl) : 'flat';
  const isLong = position.side === 'LONG';

  const closeMutation = useMutation({
    mutationFn: () => closePosition(position.market),
  });

  return (
    <tr className="border-t border-border-subtle hover:bg-bg-elevated/30 transition-colors">
      <td className="px-4 py-2.5 text-text-primary font-medium">{position.market}</td>
      <td className="px-4 py-2.5">
        <Badge variant={isLong ? 'profit' : 'loss'}>
          {isLong ? 'Long' : 'Short'}
        </Badge>
      </td>
      <td className="px-4 py-2.5 tabular-nums text-text-primary">{position.quantity}</td>
      <td className="px-4 py-2.5 tabular-nums text-text-secondary">${formatPrice(position.averagePrice)}</td>
      <td className="px-4 py-2.5 tabular-nums text-text-secondary">${formatPrice(markPrice)}</td>
      <td className="px-4 py-2.5 tabular-nums text-text-secondary">${formatPrice(position.margin)}</td>
      <td className="px-4 py-2.5 tabular-nums text-warning">${formatPrice(position.liquidationPrice)}</td>
      <td
        className={cn(
          'px-4 py-2.5 tabular-nums font-semibold',
          tone === 'profit' && 'text-profit',
          tone === 'loss'   && 'text-loss',
          tone === 'flat'   && 'text-text-secondary',
        )}
      >
        {pnl ? formatSigned(pnl) : '—'}
      </td>
      <td className="px-4 py-2.5">
        <Button
          variant="destructive"
          size="sm"
          disabled={closeMutation.isPending}
          onClick={() => closeMutation.mutate()}
          className="text-xs h-7 px-2.5"
        >
          {closeMutation.isPending ? 'Closing…' : 'Close'}
        </Button>
      </td>
    </tr>
  );
}

function EmptyState({ authenticated }: { authenticated: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg-elevated">
        <TrendingUp className="h-6 w-6 text-text-secondary/40" />
      </div>
      <div>
        <p className="text-sm font-medium text-text-secondary">
          {authenticated ? 'No open positions' : 'Sign in to track positions'}
        </p>
        <p className="mt-1 max-w-xs text-xs text-text-secondary/60 leading-relaxed">
          {authenticated
            ? 'Place a demo trade using the order panel to see entry price, margin, liquidation price and live PnL here.'
            : 'Create a free account to start practice trading and see your position lifecycle here.'}
        </p>
      </div>
    </div>
  );
}

const HEADERS = [
  'Market',
  'Side',
  'Size',
  'Entry',
  'Mark',
  'Margin',
  'Liq. price',
  'Unrealized PnL',
  'Actions',
] as const;

export function PositionsTable() {
  const markPrice = useMarketStore(s => s.indexPrice);
  const token     = useAccountStore(s => s.token);

  const { data: positions = [], error, isLoading } = useQuery({
    queryKey: ['positions', token],
    queryFn: fetchPositions,
    enabled: Boolean(token),
    refetchInterval: token ? 2_000 : false,
    retry: false,
  });

  if (!token) return <EmptyState authenticated={false} />;

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 text-xs text-loss">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Could not load positions — {error.message}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 flex flex-col gap-2">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg w-full" />
        ))}
      </div>
    );
  }

  if (positions.length === 0) return <EmptyState authenticated />;

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-max text-left text-xs" role="table">
        <thead>
          <tr className="text-text-secondary">
            {HEADERS.map(h => (
              <th key={h} className="px-4 py-2 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {positions.map(position => (
            <PositionRow
              key={position.market}
              position={position}
              markPrice={markPrice}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
