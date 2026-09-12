import { MARKET } from "@/app/config";
import { formatPrice } from "@/shared/lib/formatters";
import { useMarketStore } from "@/stores/market.store";
import { useConnectionStore } from "@/stores/connection.store";

const statusTone: Record<string, string> = {
  connected: "text-profit",
  connecting: "text-text-secondary",
  reconnecting: "text-amber-400",
  disconnected: "text-loss",
};

export function Header() {
  const indexPrice = useMarketStore(s => s.indexPrice);
  const lastTradePrice = useMarketStore(s => s.lastTradePrice);
  const status = useConnectionStore(s => s.status);

  return (
    <header className="flex items-center gap-8 border-b border-border-subtle bg-bg-card px-5 py-3">
      <span className="font-semibold tracking-tight text-text-primary">{MARKET}</span>

      <div className="flex items-baseline gap-2">
        <span className="text-lg tabular-nums text-text-primary">{formatPrice(lastTradePrice)}</span>
        <span className="text-xs text-text-secondary">last</span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="tabular-nums text-text-secondary">{formatPrice(indexPrice)}</span>
        <span className="text-xs text-text-secondary">index</span>
      </div>

      <span className={`ml-auto text-xs ${statusTone[status] ?? "text-text-secondary"}`}>
        ● {status}
      </span>
    </header>
  );
}
