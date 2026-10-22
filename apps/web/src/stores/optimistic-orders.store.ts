import { create } from "zustand";

export type OptimisticOrderStatus =
  | "Submitting"
  | "Accepted"
  | "PartiallyFilled"
  | "Filled"
  | "Rejected";

export interface OptimisticOrder {
  tempId: string;
  orderId?: string;
  market: string;
  side: "LONG" | "SHORT";
  type: "LIMIT" | "MARKET";
  quantity: string;
  filledQuantity?: string;
  price: string;
  leverage: string;
  status: OptimisticOrderStatus;
  errorMessage?: string;
  createdAt: number;
}

interface OptimisticOrdersState {
  orders: OptimisticOrder[];
  addOptimisticOrder: (order: Omit<OptimisticOrder, "status" | "createdAt">) => string;
  markAccepted: (
    tempId: string,
    orderId: string,
    statusOrFilled?: boolean | OptimisticOrderStatus,
    filledQuantity?: string,
  ) => void;
  markFilled: (orderId: string) => void;
  recordOrderFill: (orderId: string, fillQuantity: string) => void;
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
      filledQuantity: order.filledQuantity ?? "0",
      createdAt: Date.now(),
    };
    set((state) => ({
      orders: [newOrder, ...state.orders.filter((o) => o.tempId !== tempId)],
    }));
    return tempId;
  },
  markAccepted: (tempId, orderId, statusOrFilled = "Accepted", filledQuantity = "0") => {
    const status: OptimisticOrderStatus =
      typeof statusOrFilled === "boolean"
        ? statusOrFilled
          ? "Filled"
          : "Accepted"
        : statusOrFilled;
    set((state) => ({
      orders: state.orders.map((o) =>
        o.tempId === tempId
          ? {
              ...o,
              orderId,
              status,
              filledQuantity,
            }
          : o,
      ),
    }));
  },
  markFilled: (orderId) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.orderId === orderId || o.tempId === orderId
          ? { ...o, status: "Filled", filledQuantity: o.quantity }
          : o,
      ),
    }));
  },
  recordOrderFill: (orderId, fillQuantity) => {
    set((state) => ({
      orders: state.orders.map((o) => {
        if (o.orderId !== orderId && o.tempId !== orderId) return o;
        const prev = parseFloat(o.filledQuantity || "0");
        const add = parseFloat(fillQuantity || "0");
        const total = parseFloat(o.quantity || "0");
        const newFilled = prev + add;
        const isComplete = total > 0 && newFilled >= total;
        return {
          ...o,
          status: isComplete ? "Filled" : "PartiallyFilled",
          filledQuantity: newFilled.toString(),
        };
      }),
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
      orders: state.orders.filter(
        (o) =>
          o.status === "Submitting" ||
          o.status === "Accepted" ||
          o.status === "PartiallyFilled",
      ),
    }));
  },
}));
