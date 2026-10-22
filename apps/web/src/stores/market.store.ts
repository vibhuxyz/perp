import { create } from "zustand";

export type SupportedMarket = "BTC-PERP" | "ETH-PERP" | "SOL-PERP";

export interface MarketMeta {
  symbol: SupportedMarket;
  baseAsset: string;
  name: string;
  color: string;
  defaultPrice: string;
}

export const MARKET_DETAILS: Record<SupportedMarket, MarketMeta> = {
  "BTC-PERP": {
    symbol: "BTC-PERP",
    baseAsset: "BTC",
    name: "Bitcoin Perpetual",
    color: "#F7931A",
    defaultPrice: "50000",
  },
  "ETH-PERP": {
    symbol: "ETH-PERP",
    baseAsset: "ETH",
    name: "Ethereum Perpetual",
    color: "#627EEA",
    defaultPrice: "3000",
  },
  "SOL-PERP": {
    symbol: "SOL-PERP",
    baseAsset: "SOL",
    name: "Solana Perpetual",
    color: "#14F195",
    defaultPrice: "150",
  },
};

export const SUPPORTED_MARKETS: SupportedMarket[] = ["BTC-PERP", "ETH-PERP", "SOL-PERP"];

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
  currentMarket: SupportedMarket;
  bids: Level[];
  asks: Level[];
  indexPrice: string | null;
  lastTradePrice: string | null;
  high24h: string | null;
  low24h: string | null;
  trades: Trade[];
  setMarket: (market: SupportedMarket) => void;
  setBook: (bids: Level[], asks: Level[]) => void;
  setIndexPrice: (price: string) => void;
  setLastTradePrice: (price: string) => void;
  addTrade: (trade: Trade) => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  currentMarket: "BTC-PERP",
  bids: [],
  asks: [],
  indexPrice: null,
  lastTradePrice: null,
  high24h: null,
  low24h: null,
  trades: [],
  setMarket: currentMarket =>
    set({
      currentMarket,
      bids: [],
      asks: [],
      trades: [],
      indexPrice: null,
      lastTradePrice: null,
      high24h: null,
      low24h: null,
    }),
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
