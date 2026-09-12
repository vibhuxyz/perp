import { create } from "zustand";

export interface Level {
  price: string;
  quantity: string;
}

interface MarketState {
  bids: Level[];
  asks: Level[];
  indexPrice: string | null;
  lastTradePrice: string | null;
  setBook: (bids: Level[], asks: Level[]) => void;
  setIndexPrice: (price: string) => void;
  setLastTradePrice: (price: string) => void;
}

// Split into separate fields rather than one `orderbook` object so a ticker update
// does not invalidate a selector watching the bids.
export const useMarketStore = create<MarketState>(set => ({
  bids: [],
  asks: [],
  indexPrice: null,
  lastTradePrice: null,
  setBook: (bids, asks) => set({ bids, asks }),
  setIndexPrice: indexPrice => set({ indexPrice }),
  setLastTradePrice: lastTradePrice => set({ lastTradePrice }),
}));

export const selectBestBid = (s: MarketState) => s.bids[0]?.price ?? null;
export const selectBestAsk = (s: MarketState) => s.asks[0]?.price ?? null;
