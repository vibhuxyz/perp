import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { placeOrder } from "../api/tradeApi";
import { initialMargin, liquidationPrice } from "@/shared/lib/decimal";
import { useOptimisticOrders } from "./useOptimisticOrders";
import type { OptimisticOrderStatus } from "@/stores/optimistic-orders.store";

const positiveNumber = z.string().regex(/^\d+(\.\d+)?$/, "must be a positive number");

export const orderSchema = z
  .object({
    side: z.enum(["LONG", "SHORT"]),
    type: z.enum(["LIMIT", "MARKET"]),
    quantity: positiveNumber,
    price: z.string().optional(),
    leverage: positiveNumber,
  })
  .refine(v => v.type === "MARKET" || positiveNumber.safeParse(v.price).success, {
    path: ["price"],
    message: "limit orders need a price",
  });

export type OrderFormValues = z.infer<typeof orderSchema>;

const DEFAULT_VALUES: OrderFormValues = {
  side: "LONG",
  type: "LIMIT",
  quantity: "",
  price: "",
  leverage: "10",
};

function parseOrderPayload(v: OrderFormValues, market: string, indexPrice: string | null) {
  const quantity = String(Math.max(1, Math.round(parseFloat(v.quantity) || 1)));
  const leverage = String(Math.max(1, Math.round(parseFloat(v.leverage) || 1)));
  const price = v.type === "LIMIT" ? String(Math.round(parseFloat(v.price || indexPrice || "50000"))) : undefined;
  return {
    market,
    side: v.side,
    type: v.type,
    quantity,
    leverage,
    ...(price ? { price } : {}),
  };
}

export function useOrderForm(indexPrice: string | null, market = "BTC-PERP") {
  const queryClient = useQueryClient();
  const { submitOptimisticOrder, orders } = useOptimisticOrders();

  const [optimisticStatus, setOptimisticStatus] = useState<OptimisticOrderStatus | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const watched = useWatch<OrderFormValues>({ control: form.control });
  const values: OrderFormValues = { ...DEFAULT_VALUES, ...watched };
  const { side, type, quantity, price, leverage } = values;

  const previewPrice = type === "MARKET" ? indexPrice : price;
  const canPreview =
    previewPrice && Number(previewPrice) > 0 && Number(quantity) > 0 && Number(leverage) > 0;

  const margin = canPreview ? initialMargin(previewPrice, quantity, leverage) : null;
  const liquidation = canPreview && margin
    ? liquidationPrice(side, previewPrice, margin, quantity)
    : null;

  const submitOrder = form.handleSubmit(async v => {
    setLastError(null);
    setIsSubmitting(true);
    setOptimisticStatus("Submitting");

    const payload = parseOrderPayload(v, market, indexPrice);
    try {
      await submitOptimisticOrder(
        {
          market,
          side: v.side,
          type: v.type,
          quantity: payload.quantity,
          price: payload.price ?? indexPrice ?? "0",
          leverage: payload.leverage,
        },
        () => placeOrder(payload),
      );

      setOptimisticStatus("Accepted");
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["equity"] });
      queryClient.invalidateQueries({ queryKey: ["depth"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch (err) {
      setLastError(err instanceof Error ? err.message : "Order failed");
      setOptimisticStatus("Rejected");
    } finally {
      setIsSubmitting(false);
    }
  });

  return {
    form,
    values,
    margin,
    liquidation,
    submitOrder,
    isSubmitting,
    optimisticStatus,
    lastError,
    optimisticOrders: orders,
  };
}
