import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { MARKET } from "@/app/config";
import { placeOrder } from "../api/tradeApi";
import { initialMargin, liquidationPrice } from "@/shared/lib/decimal";
import { formatPrice } from "@/shared/lib/formatters";
import { ApiError } from "@/shared/lib/api";

const positiveNumber = z.string().regex(/^\d+(\.\d+)?$/, "must be a positive number");

const schema = z
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

type FormValues = z.infer<typeof schema>;

export function OrderTicket({ indexPrice }: { indexPrice: string | null }) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { side: "LONG", type: "LIMIT", quantity: "1", price: "50000", leverage: "2" },
  });

  const mutation = useMutation({
    mutationFn: placeOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["equity"] });
    },
  });

  const values = watch();
  // A market order has no price of its own, so preview it against the index.
  const previewPrice = values.type === "MARKET" ? indexPrice : values.price;
  const canPreview =
    previewPrice && Number(previewPrice) > 0 && Number(values.quantity) > 0 && Number(values.leverage) > 0;

  const margin = canPreview ? initialMargin(previewPrice, values.quantity, values.leverage) : null;
  const liquidation = canPreview && margin
    ? liquidationPrice(values.side, previewPrice, margin, values.quantity)
    : null;

  const onSubmit = handleSubmit(v =>
    mutation.mutate({
      market: MARKET,
      side: v.side,
      type: v.type,
      quantity: v.quantity,
      leverage: v.leverage,
      ...(v.type === "LIMIT" ? { price: v.price } : {}),
    }),
  );

  return (
    <section className="rounded border border-border-subtle bg-bg-card p-3">
      <h2 className="mb-3 text-xs text-text-secondary">Order</h2>

      <form onSubmit={onSubmit} className="grid gap-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <select {...register("side")} className="rounded bg-bg-elevated px-2 py-1.5">
            <option value="LONG">Long</option>
            <option value="SHORT">Short</option>
          </select>
          <select {...register("type")} className="rounded bg-bg-elevated px-2 py-1.5">
            <option value="LIMIT">Limit</option>
            <option value="MARKET">Market</option>
          </select>
        </div>

        <label className="grid gap-1">
          <span className="text-xs text-text-secondary">Price</span>
          <input
            {...register("price")}
            disabled={values.type === "MARKET"}
            className="rounded bg-bg-elevated px-2 py-1.5 tabular-nums disabled:opacity-40"
          />
          {formState.errors.price && (
            <span className="text-xs text-loss">{formState.errors.price.message}</span>
          )}
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-text-secondary">Size</span>
          <input {...register("quantity")} className="rounded bg-bg-elevated px-2 py-1.5 tabular-nums" />
          {formState.errors.quantity && (
            <span className="text-xs text-loss">{formState.errors.quantity.message}</span>
          )}
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-text-secondary">Leverage</span>
          <input {...register("leverage")} className="rounded bg-bg-elevated px-2 py-1.5 tabular-nums" />
        </label>

        <dl className="grid gap-1 border-t border-border-subtle pt-2 text-xs text-text-secondary">
          <div className="flex justify-between">
            <dt>Margin</dt>
            <dd className="tabular-nums">{margin ? formatPrice(margin) : "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Est. liquidation</dt>
            <dd className="tabular-nums">{liquidation ? formatPrice(liquidation) : "—"}</dd>
          </div>
        </dl>

        <button
          type="submit"
          disabled={mutation.isPending}
          className={`rounded px-3 py-2 font-medium text-black disabled:opacity-50 ${
            values.side === "LONG" ? "bg-profit" : "bg-loss"
          }`}
        >
          {mutation.isPending ? "Submitting…" : values.side === "LONG" ? "Long" : "Short"}
        </button>

        {mutation.error && (
          <p className="text-xs text-loss">
            Order rejected — {mutation.error instanceof ApiError
              ? mutation.error.message
              : "could not reach the exchange"}
          </p>
        )}

        {mutation.data && (
          <p className="text-xs text-text-secondary">
            {mutation.data.status} · filled {mutation.data.filledQuantity}
          </p>
        )}
      </form>
    </section>
  );
}
