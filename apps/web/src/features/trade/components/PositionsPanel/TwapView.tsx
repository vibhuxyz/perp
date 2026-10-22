import { Activity, Clock } from 'lucide-react';

export function TwapView() {
  return (
    <div className="p-8 flex flex-col items-center justify-center text-center gap-3 font-sans">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 text-info">
        <Activity className="h-5 w-5" />
      </div>
      <div className="flex flex-col gap-1 max-w-md">
        <span className="text-white font-bold text-sm">No Active TWAP Strategies</span>
        <span className="text-text-muted text-xs">
          Time-Weighted Average Price (TWAP) execution orders break large notional volume into continuous slices across your chosen execution window.
        </span>
      </div>
      <div className="flex items-center gap-2 text-text-secondary text-[11px] bg-bg-card-hover px-3 py-1.5 rounded-lg border border-border-subtle mt-1 font-mono">
        <Clock className="h-3.5 w-3.5 text-text-muted" />
        <span>Default slice duration: 5 minutes · Min clip: 1 contract</span>
      </div>
    </div>
  );
}
