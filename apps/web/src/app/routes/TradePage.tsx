import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { MARKET } from "@/app/config";
import { fetchDepth } from "@/features/trade/api/tradeApi";
import { OrderBook } from "@/features/trade/components/OrderBook";
import { OrderTicket } from "@/features/trade/components/OrderTicket";
import { PositionsTable } from "@/features/positions/components/PositionsTable";
import { useMarketStore } from "@/stores/market.store";

export default function TradePage() {
  const bids = useMarketStore(s => s.bids);
  const asks = useMarketStore(s => s.asks);
  const indexPrice = useMarketStore(s => s.indexPrice);
  const setBook = useMarketStore(s => s.setBook);

  // Polled, not pushed — the engine has no depth channel yet. This is the one
  // remaining OK-rung shortcut and it goes away when the backend broadcasts the book.
  const { data: depth } = useQuery({
    queryKey: ["depth", MARKET],
    queryFn: () => fetchDepth(MARKET),
    refetchInterval: 1_000,
  });

  useEffect(() => {
    if (depth) setBook(depth.bids, depth.asks);
  }, [depth, setBook]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px_280px]">
      <section className="flex min-h-64 items-center justify-center rounded border border-border-subtle bg-bg-card text-sm text-text-secondary">
        Chart — blocked until the engine serves candles
      </section>

      <OrderBook bids={bids} asks={asks} />
      <OrderTicket indexPrice={indexPrice} />

      <section className="rounded border border-border-subtle bg-bg-card lg:col-span-3">
        <h2 className="border-b border-border-subtle px-3 py-1.5 text-xs text-text-secondary">
          Positions
        </h2>
        <PositionsTable />
      </section>
    </div>
  );
}
