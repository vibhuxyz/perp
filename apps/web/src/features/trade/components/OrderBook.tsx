import { memo } from "react";
import type { Level } from "@/stores/market.store";
import { formatPrice, formatSize } from "@/shared/lib/formatters";

const DEPTH = 12;

const Row = memo(function Row({ level, tone }: { level: Level; tone: "profit" | "loss" }) {
  return (
    <div className="flex justify-between px-2 py-0.5 text-xs tabular-nums">
      <span className={tone === "profit" ? "text-profit" : "text-loss"}>
        {formatPrice(level.price)}
      </span>
      <span className="text-text-secondary">{formatSize(level.quantity)}</span>
    </div>
  );
});

export function OrderBook({ bids, asks }: { bids: Level[]; asks: Level[] }) {
  // The engine keeps the full book; we render a slice. Deep levels are noise on screen
  // and the cost of rendering them is paid on every tick.
  const topAsks = asks.slice(0, DEPTH).reverse();
  const topBids = bids.slice(0, DEPTH);

  return (
    <section className="rounded border border-border-subtle bg-bg-card">
      <h2 className="border-b border-border-subtle px-2 py-1.5 text-xs text-text-secondary">
        Order Book
      </h2>

      <div className="py-1">
        {topAsks.length === 0 && <p className="px-2 py-1 text-xs text-text-secondary">no asks</p>}
        {topAsks.map(level => <Row key={`a${level.price}`} level={level} tone="loss" />)}
      </div>

      <div className="border-y border-border-subtle px-2 py-1 text-xs text-text-secondary">
        spread
      </div>

      <div className="py-1">
        {topBids.length === 0 && <p className="px-2 py-1 text-xs text-text-secondary">no bids</p>}
        {topBids.map(level => <Row key={`b${level.price}`} level={level} tone="profit" />)}
      </div>
    </section>
  );
}
