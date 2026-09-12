import { useCallback } from "react";
import { config } from "@/app/config";
import { useWebSocket } from "@/shared/hooks/useWebSocket";
import { useMarketStore } from "@/stores/market.store";

interface FeedEvent {
  type: string;
  price?: string;
  fill?: { price: string };
}

/**
 * Routes engine events into the market store. The feed carries fills, index ticks,
 * funding and liquidations — depth is still polled, because the engine does not
 * broadcast the book yet.
 */
export function useMarketFeed() {
  const setIndexPrice = useMarketStore(s => s.setIndexPrice);
  const setLastTradePrice = useMarketStore(s => s.setLastTradePrice);

  const onMessage = useCallback(
    (data: unknown) => {
      const event = data as FeedEvent;

      if (event.type === "index" && event.price) {
        setIndexPrice(event.price);
      }

      if (event.type === "fill" && event.fill) {
        setLastTradePrice(event.fill.price);
      }
    },
    [setIndexPrice, setLastTradePrice],
  );

  useWebSocket(config.wsUrl, onMessage);
}
