import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { config } from "@/app/config";
import { useWebSocket } from "@/shared/hooks/useWebSocket";
import { useMarketStore } from "@/stores/market.store";

interface FeedEvent {
  type: string;
  price?: string;
  fill?: {
    fillId?: string;
    price: string;
    quantity: string;
    createdAt?: string;
  };
  payments?: unknown[];
  position?: unknown;
}

/**
 * Routes engine events into the market store and invalidates TanStack queries.
 * Handles:
 * - 'index': real-time mark/index price ticks from mark-price-poller
 * - 'fill': trade executions, records fills and invalidates positions/equity/depth
 * - 'funding': 10s funding payments settlement
 * - 'liquidation': position liquidation alerts
 */
export function useMarketFeed() {
  const queryClient = useQueryClient();
  const setIndexPrice = useMarketStore(s => s.setIndexPrice);
  const setLastTradePrice = useMarketStore(s => s.setLastTradePrice);
  const addTrade = useMarketStore(s => s.addTrade);

  const onMessage = useCallback(
    (data: unknown) => {
      const event = data as FeedEvent;

      if (event.type === "index" && event.price) {
        setIndexPrice(event.price);
      }

      if (event.type === "fill" && event.fill) {
        setLastTradePrice(event.fill.price);

        addTrade({
          id: event.fill.fillId ?? crypto.randomUUID(),
          price: event.fill.price,
          size: event.fill.quantity,
          time: new Date().toLocaleTimeString(),
          isUp: true,
        });

        // Instant query invalidation on fill
        queryClient.invalidateQueries({ queryKey: ["positions"] });
        queryClient.invalidateQueries({ queryKey: ["equity"] });
        queryClient.invalidateQueries({ queryKey: ["depth"] });
      }

      if (event.type === "funding") {
        queryClient.invalidateQueries({ queryKey: ["equity"] });
      }

      if (event.type === "liquidation") {
        queryClient.invalidateQueries({ queryKey: ["positions"] });
        queryClient.invalidateQueries({ queryKey: ["equity"] });
      }
    },
    [setIndexPrice, setLastTradePrice, addTrade, queryClient],
  );

  useWebSocket(config.wsUrl, onMessage);
}
