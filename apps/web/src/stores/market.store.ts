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
  setIndexPrice: indexPrice => set({ indexPrice }),
  setLastTradePrice: lastTradePrice => {
    const num = parseFloat(lastTradePrice);
    if (!isNaN(num)) {
      const { high24h, low24h } = get();
      const curHigh = high24h ? parseFloat(high24h) : num;
      const curLow = low24h ? parseFloat(low24h) : num;
      set({
        lastTradePrice,
        high24h: Math.max(curHigh, num).toString(),
        low24h: Math.min(curLow, num).toString(),
      });
    } else {
      set({ lastTradePrice });
    }
  },
  addTrade: trade => {
    const num = parseFloat(trade.price);
    if (!isNaN(num)) {
      const { high24h, low24h } = get();
      const curHigh = high24h ? parseFloat(high24h) : num;
      const curLow = low24h ? parseFloat(low24h) : num;
      set(state => ({
        lastTradePrice: trade.price,
        high24h: Math.max(curHigh, num).toString(),
        low24h: Math.min(curLow, num).toString(),
        trades: [trade, ...state.trades.slice(0, 49)],
      }));
    } else {
      set(state => ({
        lastTradePrice: trade.price,
        trades: [trade, ...state.trades.slice(0, 49)],
      }));
    }
  },
}));

export const selectBestBid = (s: MarketState) => s.bids[0]?.price ?? null;
export const selectBestAsk = (s: MarketState) => s.asks[0]?.price ?? null;
