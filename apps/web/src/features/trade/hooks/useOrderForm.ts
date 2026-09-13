import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { MARKET } from "@/app/config";
import { placeOrder } from "../api/tradeApi";
import { initialMargin, liquidationPrice } from "@/shared/lib/decimal";

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

export function useOrderForm(indexPrice: string | null) {
  const queryClient = useQueryClient();

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { side: "LONG", type: "LIMIT", quantity: "1", price: "50000", leverage: "2" },
  });

  const mutation = useMutation({
    mutationFn: placeOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["equity"] });
    },
  });

  const values = form.watch();
  const previewPrice = values.type === "MARKET" ? indexPrice : values.price;
  const canPreview =
    previewPrice && Number(previewPrice) > 0 && Number(values.quantity) > 0 && Number(values.leverage) > 0;

  const margin = canPreview ? initialMargin(previewPrice, values.quantity, values.leverage) : null;
  const liquidation = canPreview && margin
    ? liquidationPrice(values.side, previewPrice, margin, values.quantity)
    : null;

  const submitOrder = form.handleSubmit(v =>
    mutation.mutate({
      market: MARKET,
      side: v.side,
      type: v.type,
      quantity: v.quantity,
      leverage: v.leverage,
      ...(v.type === "LIMIT" ? { price: v.price } : {}),
    }),
  );

  return {
    form,
    mutation,
    values,
    margin,
    liquidation,
    submitOrder,
  };
}
