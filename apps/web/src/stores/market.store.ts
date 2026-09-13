import { create } from "zustand";

export interface Level {
  price: string;
  quantity: string;
}

export interface Trade {
  id: string;
  price: string;
  size: string;
  time: string;
  isUp: boolean;
}

interface MarketState {
  bids: Level[];
  asks: Level[];
  indexPrice: string | null;
  lastTradePrice: string | null;
  high24h: string | null;
  low24h: string | null;
  trades: Trade[];
  setBook: (bids: Level[], asks: Level[]) => void;
  setIndexPrice: (price: string) => void;
  setLastTradePrice: (price: string) => void;
  addTrade: (trade: Trade) => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  bids: [],
  asks: [],
  indexPrice: null,
  lastTradePrice: null,
  high24h: null,
  low24h: null,
  trades: [],
  setBook: (bids, asks) => set({ bids, asks }),
  setIndexPrice: indexPrice => {
    const num = parseFloat(indexPrice);
    if (!isNaN(num)) {
      const curHigh = get().high24h ? parseFloat(get().high24h!) : num;
      const curLow = get().low24h ? parseFloat(get().low24h!) : num;
      set({
        indexPrice,
        high24h: (Math.max(curHigh, num)).toString(),
        low24h: (Math.min(curLow, num)).toString(),
      });
    } else {
      set({ indexPrice });
    }
  },
  setLastTradePrice: lastTradePrice => {
    const num = parseFloat(lastTradePrice);
    if (!isNaN(num)) {
      const curHigh = get().high24h ? parseFloat(get().high24h!) : num;
      const curLow = get().low24h ? parseFloat(get().low24h!) : num;
      set({
        lastTradePrice,
        high24h: (Math.max(curHigh, num)).toString(),
        low24h: (Math.min(curLow, num)).toString(),
      });
    } else {
      set({ lastTradePrice });
    }
  },
  addTrade: trade => set(state => ({
    trades: [trade, ...state.trades.slice(0, 49)],
  })),
}));

export const selectBestBid = (s: MarketState) => s.bids[0]?.price ?? null;
export const selectBestAsk = (s: MarketState) => s.asks[0]?.price ?? null;
