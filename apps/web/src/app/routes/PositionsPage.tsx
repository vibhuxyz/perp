import { useQuery } from '@tanstack/react-query';
import { fetchPositions } from '@/features/trade/api/tradeApi';
import { useAccountStore } from '@/stores/account.store';
import { PositionsTable } from '@/features/positions/components/PositionsTable';
import { Badge } from '@/components/ui/badge';

export default function PositionsPage() {
  const token     = useAccountStore(s => s.token);

  const { data: positions = [] } = useQuery({
    queryKey: ['positions', token],
    queryFn: fetchPositions,
    enabled: Boolean(token),
    refetchInterval: token ? 2_000 : false,
    retry: false,
  });

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-text-primary">Positions</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Your open practice positions with live PnL updates.
          </p>
        </div>
        {positions.length > 0 && (
          <Badge variant="default">{positions.length} open</Badge>
        )}
      </div>

      <section aria-label="Open positions" className="rounded-xl border border-border-subtle bg-bg-card overflow-hidden">
        <PositionsTable />
      </section>
    </div>
  );
}
