import { useOptimistic, useTransition, useCallback } from "react";
import {
  useOptimisticOrdersStore,
  type OptimisticOrder,
  type OptimisticOrderStatus,
} from "@/stores/optimistic-orders.store";

type OptimisticAction =
  | { type: "ADD"; order: OptimisticOrder }
  | {
      type: "UPDATE_STATUS";
      tempId: string;
      status: OptimisticOrderStatus;
      errorMessage?: string;
      filledQuantity?: string;
    };

export function useOptimisticOrders() {
  const storeOrders = useOptimisticOrdersStore((s) => s.orders);
  const addStoreOrder = useOptimisticOrdersStore((s) => s.addOptimisticOrder);
  const markAccepted = useOptimisticOrdersStore((s) => s.markAccepted);
  const markFilled = useOptimisticOrdersStore((s) => s.markFilled);
  const markRejected = useOptimisticOrdersStore((s) => s.markRejected);
  const recordOrderFill = useOptimisticOrdersStore((s) => s.recordOrderFill);
  const removeOrder = useOptimisticOrdersStore((s) => s.removeOrder);

  const [isPending, startTransition] = useTransition();

  const [optimisticOrders, setOptimisticAction] = useOptimistic<
    OptimisticOrder[],
    OptimisticAction
  >(storeOrders, (state, action) => {
    if (action.type === "ADD") {
      return [action.order, ...state.filter((o) => o.tempId !== action.order.tempId)];
    }
    if (action.type === "UPDATE_STATUS") {
      return state.map((o) =>
        o.tempId === action.tempId
          ? {
              ...o,
              status: action.status,
              errorMessage: action.errorMessage ?? o.errorMessage,
              filledQuantity: action.filledQuantity ?? o.filledQuantity,
            }
          : o,
      );
    }
    return state;
  });

  const submitOptimisticOrder = useCallback(
    async (
      orderData: Omit<OptimisticOrder, "status" | "createdAt" | "tempId">,
      apiCall: () => Promise<{ orderId: string; status: string; filledQuantity: string; fills: number }>,
    ): Promise<{ tempId: string; status: OptimisticOrderStatus }> => {
      const tempId = `opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const optimisticEntry: OptimisticOrder = {
        ...orderData,
        tempId,
        status: "Submitting",
        filledQuantity: "0",
        createdAt: Date.now(),
      };

      setOptimisticAction({ type: "ADD", order: optimisticEntry });
      addStoreOrder(optimisticEntry);

      return new Promise<{ tempId: string; status: OptimisticOrderStatus }>((resolve, reject) => {
        startTransition(async () => {
          try {
            const result = await apiCall();
            const status: OptimisticOrderStatus =
              result.status === "filled"
                ? "Filled"
                : result.status === "partially_filled"
                ? "PartiallyFilled"
                : "Accepted";

            markAccepted(tempId, result.orderId, status, result.filledQuantity);
            setOptimisticAction({
              type: "UPDATE_STATUS",
              tempId,
              status,
              filledQuantity: result.filledQuantity,
            });
            resolve({ tempId, status });
          } catch (err) {
            const message = err instanceof Error ? err.message : "Order rejected";
            markRejected(tempId, message);
            setOptimisticAction({
              type: "UPDATE_STATUS",
              tempId,
              status: "Rejected",
              errorMessage: message,
            });
            reject(err);
          }
        });
      });
    },
    [addStoreOrder, markAccepted, markRejected, setOptimisticAction],
  );

  return {
    orders: optimisticOrders,
    isTransitionPending: isPending,
    submitOptimisticOrder,
    markFilled,
    recordOrderFill,
    removeOrder,
  };
}
