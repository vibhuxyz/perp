import { useCallback } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { config } from "@/app/config";
import { useWebSocket } from "@/shared/hooks/useWebSocket";
import { useMarketStore, type Level } from "@/stores/market.store";
import { useOptimisticOrdersStore } from "@/stores/optimistic-orders.store";

interface FeedEvent {
  type: string;
  market?: string;
  price?: string;
  bids?: Level[];
  asks?: Level[];
  fill?: {
    fillId?: string;
    market?: string;
    price: string;
    quantity: string;
    takerOrderId?: string;
    makerOrderId?: string;
    createdAt?: string;
  };
  payments?: unknown[];
  position?: unknown;
}

function handlePriceAndDepth(
  event: FeedEvent,
  currentMarket: string,
  setIndexPrice: (p: string) => void,
  setBook: (bids: Level[], asks: Level[]) => void,
) {
  const matchesMarket = !event.market || event.market === currentMarket;
  if (event.type === "index" && event.price && matchesMarket) {
    setIndexPrice(event.price);
  } else if (event.type === "depth" && event.bids && event.asks && matchesMarket) {
    setBook(event.bids, event.asks);
  }
}

function handleFillExecution(
  event: FeedEvent,
  currentMarket: string,
  setLastTradePrice: (p: string) => void,
  addTrade: (t: { id: string; price: string; size: string; time: string; isUp: boolean }) => void,
  recordOrderFill: (id: string, qty: string) => void,
  queryClient: QueryClient,
) {
  if (event.type !== "fill" || !event.fill) return;

  const fillMarket = event.fill.market ?? event.market;
  if (!fillMarket || fillMarket === currentMarket) {
    setLastTradePrice(event.fill.price);
    addTrade({
      id: event.fill.fillId ?? crypto.randomUUID(),
      price: event.fill.price,
      size: event.fill.quantity,
      time: new Date().toLocaleTimeString(),
      isUp: true,
    });
  }

  if (event.fill.takerOrderId) recordOrderFill(event.fill.takerOrderId, event.fill.quantity);
  if (event.fill.makerOrderId) recordOrderFill(event.fill.makerOrderId, event.fill.quantity);

  queryClient.invalidateQueries({ queryKey: ["positions"] });
  queryClient.invalidateQueries({ queryKey: ["equity"] });
  queryClient.invalidateQueries({ queryKey: ["depth"] });
  queryClient.invalidateQueries({ queryKey: ["orders"] });
}

export function useMarketFeed() {
  const queryClient = useQueryClient();
  const currentMarket = useMarketStore(s => s.currentMarket);
  const setBook = useMarketStore(s => s.setBook);
  const setIndexPrice = useMarketStore(s => s.setIndexPrice);
  const setLastTradePrice = useMarketStore(s => s.setLastTradePrice);
  const addTrade = useMarketStore(s => s.addTrade);
  const recordOrderFill = useOptimisticOrdersStore(s => s.recordOrderFill);

  const onMessage = useCallback(
    (data: unknown) => {
      const event = data as FeedEvent;
      handlePriceAndDepth(event, currentMarket, setIndexPrice, setBook);
      handleFillExecution(event, currentMarket, setLastTradePrice, addTrade, recordOrderFill, queryClient);

      if (event.type === "funding" || event.type === "liquidation") {
        queryClient.invalidateQueries({ queryKey: ["positions"] });
        queryClient.invalidateQueries({ queryKey: ["equity"] });
      }
    },
    [currentMarket, setBook, setIndexPrice, setLastTradePrice, addTrade, recordOrderFill, queryClient],
  );

  useWebSocket(config.wsUrl, onMessage);
}
