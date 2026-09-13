import { useQuery } from '@tanstack/react-query';
import { useAccountStore } from '@/stores/account.store';
import { fetchEquity } from '../api/tradeApi';
import { formatPrice } from '@/shared/lib/formatters';
import { FlaskConical, Info } from 'lucide-react';

/**
 * Always visible when authenticated.
 * Reminds the learner that all trading uses virtual money — non-negotiable per spec.
 * Balance updates every 5 s without rerendering the rest of the layout.
 */
export function PracticeModeBar() {
  const token = useAccountStore(s => s.token);

  const { data: equity } = useQuery({
    queryKey: ['equity', token],
    queryFn: fetchEquity,
    enabled: Boolean(token),
    refetchInterval: token ? 5_000 : false,
    retry: false,
  });

  if (!token) return null;

  const balance = equity ? `$${formatPrice(equity.availableBalance)}` : '—';
  const locked  = equity ? `$${formatPrice(equity.marginLocked)}`     : null;

  return (
    <div
      role="status"
      aria-label="Practice mode active"
      className="flex items-center gap-3 border-b border-border-subtle bg-brand/5 px-4 py-1.5 text-xs overflow-x-auto scrollbar-none shrink-0"
    >
      {/* Mode badge */}
      <div className="flex items-center gap-1.5 text-brand shrink-0">
        <FlaskConical className="h-3.5 w-3.5" aria-hidden />
        <span className="font-semibold">Practice mode</span>
      </div>

      <span className="text-border-subtle">·</span>

      {/* Virtual balance */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-text-secondary">Virtual balance:</span>
        <span className="tabular-nums font-semibold text-text-primary">{balance}</span>
      </div>

      {locked && locked !== '$—' && (
        <>
          <span className="text-border-subtle">·</span>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-text-secondary">Margin locked:</span>
            <span className="tabular-nums text-text-secondary">{locked}</span>
          </div>
        </>
      )}

      {/* Reminder */}
      <div className="ml-auto flex items-center gap-1 text-text-secondary/70 shrink-0">
        <Info className="h-3 w-3" aria-hidden />
        <span className="hidden sm:inline">No real money is involved</span>
      </div>
    </div>
  );
}
