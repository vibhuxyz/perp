import { create } from "zustand";
import { MARKET } from "@/app/config";

export type OrderSide = "LONG" | "SHORT";
export type OrderType = "LIMIT" | "MARKET";

interface UiState {
  market: string;
  side: OrderSide;
  orderType: OrderType;
  leverage: number;
  sidebarCollapsed: boolean;
  setMarket: (market: string) => void;
  setSide: (side: OrderSide) => void;
  setOrderType: (orderType: OrderType) => void;
  setLeverage: (leverage: number) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUiStore = create<UiState>(set => ({
  market: MARKET,
  side: "LONG",
  orderType: "LIMIT",
  leverage: 2,
  sidebarCollapsed: false,
  setMarket: market => set({ market }),
  setSide: side => set({ side }),
  setOrderType: orderType => set({ orderType }),
  setLeverage: leverage => set({ leverage }),
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: sidebarCollapsed => set({ sidebarCollapsed }),
}));
