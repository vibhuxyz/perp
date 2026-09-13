import { useForm, useWatch } from "react-hook-form";
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

const DEFAULT_VALUES: OrderFormValues = {
  side: "LONG",
  type: "LIMIT",
  quantity: "",
  price: "",
  leverage: "10",
};

export function useOrderForm(indexPrice: string | null) {
  const queryClient = useQueryClient();

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const mutation = useMutation({
    mutationFn: placeOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["equity"] });
      queryClient.invalidateQueries({ queryKey: ["depth"] });
    },
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

  const submitOrder = form.handleSubmit(v =>
    mutation.mutate({
      market: MARKET,
      side: v.side,
      type: v.type,
      quantity: String(Math.max(1, Math.round(parseFloat(v.quantity) || 1))),
      leverage: String(Math.max(1, Math.round(parseFloat(v.leverage) || 1))),
      ...(v.type === "LIMIT" ? { price: String(Math.round(parseFloat(v.price || indexPrice || "50000"))) } : {}),
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
