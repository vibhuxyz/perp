import { useOptimistic, useTransition, useCallback } from "react";
import {
  useOptimisticOrdersStore,
  type OptimisticOrder,
  type OptimisticOrderStatus,
} from "@/stores/optimistic-orders.store";

type OptimisticAction =
  | { type: "ADD"; order: OptimisticOrder }
  | { type: "UPDATE_STATUS"; tempId: string; status: OptimisticOrderStatus; errorMessage?: string };

export function useOptimisticOrders() {
  const storeOrders = useOptimisticOrdersStore((s) => s.orders);
  const addStoreOrder = useOptimisticOrdersStore((s) => s.addOptimisticOrder);
  const markAccepted = useOptimisticOrdersStore((s) => s.markAccepted);
  const markFilled = useOptimisticOrdersStore((s) => s.markFilled);
  const markRejected = useOptimisticOrdersStore((s) => s.markRejected);
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
          ? { ...o, status: action.status, errorMessage: action.errorMessage ?? o.errorMessage }
          : o,
      );
    }
    return state;
  });

  const submitOptimisticOrder = useCallback(
    async (
      orderData: Omit<OptimisticOrder, "status" | "createdAt" | "tempId">,
      apiCall: () => Promise<{ orderId: string; status: string; filledQuantity: string; fills: number }>,
    ) => {
      const tempId = `opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const optimisticEntry: OptimisticOrder = {
        ...orderData,
        tempId,
        status: "Submitting",
        createdAt: Date.now(),
      };

      let result: { orderId: string; status: string; filledQuantity: string; fills: number } | null = null;

      startTransition(async () => {
        setOptimisticAction({ type: "ADD", order: optimisticEntry });
        addStoreOrder(optimisticEntry);

        try {
          result = await apiCall();
          const isFilled = result.status === "filled";
          markAccepted(tempId, result.orderId, isFilled);
          setOptimisticAction({
            type: "UPDATE_STATUS",
            tempId,
            status: isFilled ? "Filled" : "Accepted",
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Order rejected";
          markRejected(tempId, message);
          setOptimisticAction({
            type: "UPDATE_STATUS",
            tempId,
            status: "Rejected",
            errorMessage: message,
          });
          throw err;
        }
      });

      return tempId;
    },
    [addStoreOrder, markAccepted, markRejected, setOptimisticAction],
  );

  return {
    orders: optimisticOrders,
    isTransitionPending: isPending,
    submitOptimisticOrder,
    markFilled,
    removeOrder,
  };
}
