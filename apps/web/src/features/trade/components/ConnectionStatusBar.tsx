import { useConnectionStore } from '@/stores/connection.store';
import { WifiOff, RefreshCw } from 'lucide-react';

/**
 * Shows stale/reconnecting status only — never pretend disconnected data is live.
 * Renders nothing when the feed is healthy.
 */
export function ConnectionStatusBar() {
  const status = useConnectionStore(s => s.status);

  if (status === 'connected') return null;

  const isReconnecting = status === 'reconnecting' || status === 'connecting';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        'flex items-center gap-2 border-b px-4 py-1.5 text-xs shrink-0',
        isReconnecting
          ? 'border-warning/20 bg-warning/5 text-warning'
          : 'border-loss/20 bg-loss/5 text-loss',
      ].join(' ')}
    >
      {isReconnecting ? (
        <RefreshCw className="h-3 w-3 animate-spin shrink-0" aria-hidden />
      ) : (
        <WifiOff className="h-3 w-3 shrink-0" aria-hidden />
      )}
      <span>
        {isReconnecting
          ? 'Reconnecting to market feed — prices may be delayed'
          : 'Market feed disconnected — prices shown are not live'}
      </span>
    </div>
  );
}
