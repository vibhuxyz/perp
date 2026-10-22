import { create } from "zustand";

export type OptimisticOrderStatus = "Submitting" | "Accepted" | "Filled" | "Rejected";

export interface OptimisticOrder {
  tempId: string;
  orderId?: string;
  market: string;
  side: "LONG" | "SHORT";
  type: "LIMIT" | "MARKET";
  quantity: string;
  price: string;
  leverage: string;
  status: OptimisticOrderStatus;
  errorMessage?: string;
  createdAt: number;
}

interface OptimisticOrdersState {
  orders: OptimisticOrder[];
  addOptimisticOrder: (order: Omit<OptimisticOrder, "status" | "createdAt">) => string;
  markAccepted: (tempId: string, orderId: string, isFilled?: boolean) => void;
  markFilled: (orderId: string) => void;
  markRejected: (tempId: string, errorMessage: string) => void;
  removeOrder: (tempId: string) => void;
  clearTerminal: () => void;
}

export const useOptimisticOrdersStore = create<OptimisticOrdersState>((set) => ({
  orders: [],
  addOptimisticOrder: (order) => {
    const tempId = order.tempId || `opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newOrder: OptimisticOrder = {
      ...order,
      tempId,
      status: "Submitting",
      createdAt: Date.now(),
    };
    set((state) => ({
      orders: [newOrder, ...state.orders.filter((o) => o.tempId !== tempId)],
    }));
    return tempId;
  },
  markAccepted: (tempId, orderId, isFilled = false) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.tempId === tempId
          ? {
              ...o,
              orderId,
              status: isFilled ? "Filled" : "Accepted",
            }
          : o,
      ),
    }));
  },
  markFilled: (orderId) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.orderId === orderId || o.tempId === orderId ? { ...o, status: "Filled" } : o,
      ),
    }));
  },
  markRejected: (tempId, errorMessage) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.tempId === tempId ? { ...o, status: "Rejected", errorMessage } : o,
      ),
    }));
  },
  removeOrder: (tempId) => {
    set((state) => ({
      orders: state.orders.filter((o) => o.tempId !== tempId),
    }));
  },
  clearTerminal: () => {
    set((state) => ({
      orders: state.orders.filter((o) => o.status === "Submitting" || o.status === "Accepted"),
    }));
  },
}));
