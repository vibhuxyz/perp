import type { OptimisticOrderStatus } from "@/stores/optimistic-orders.store";
import { AlertTriangle } from "lucide-react";

export function OptimisticStatusBanner({
  status,
  symbol,
  error,
}: {
  status: OptimisticOrderStatus | null;
  symbol: string;
  error: string | null;
}) {
  if (status === "Submitting") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-info/30 bg-info/10 p-2.5 text-xs text-info animate-pulse">
        <span className="h-2 w-2 rounded-full bg-info animate-ping" />
        <span>Submitting order to matching engine…</span>
      </div>
    );
  }

  if (status === "Accepted") {
    return (
      <div className="rounded-lg border border-[#00DA8E]/30 bg-[#00DA8E]/10 p-2.5 text-xs text-[#00DA8E]">
        ✓ Order accepted & resting on book · {symbol}
      </div>
    );
  }

  if (status === "PartiallyFilled") {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning/10 p-2.5 text-xs text-warning font-semibold">
        ⚡ Order partially filled on {symbol}! Remaining resting on book.
      </div>
    );
  }

  if (status === "Filled") {
    return (
      <div className="rounded-lg border border-[#F7931A]/30 bg-[#F7931A]/10 p-2.5 text-xs text-[#F7931A] font-semibold">
        ★ Order filled completely on {symbol}!
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-loss/30 bg-loss/10 p-2.5 text-xs text-loss">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <span>Order rejected: {error}</span>
      </div>
    );
  }

  return null;
}
