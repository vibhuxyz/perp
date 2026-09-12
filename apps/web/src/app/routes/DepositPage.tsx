import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deposit, fetchEquity } from "@/features/trade/api/tradeApi";
import { formatPrice } from "@/shared/lib/formatters";

export default function DepositPage() {
  const [amount, setAmount] = useState("1000000");
  const queryClient = useQueryClient();

  const { data: equity } = useQuery({ queryKey: ["equity"], queryFn: fetchEquity, retry: false });

  const mutation = useMutation({
    mutationFn: deposit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["equity"] }),
  });

  return (
    <section className="grid max-w-xl gap-3 rounded border border-border-subtle bg-bg-card p-4">
      <h1 className="text-sm">Deposit</h1>

      <dl className="grid gap-1 text-xs text-text-secondary">
        <div className="flex justify-between">
          <dt>Available</dt>
          <dd className="tabular-nums">{formatPrice(equity?.availableBalance)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Margin locked</dt>
          <dd className="tabular-nums">{formatPrice(equity?.marginLocked)}</dd>
        </div>
      </dl>

      <div className="flex gap-2">
        <input
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="flex-1 rounded bg-bg-elevated px-2 py-1.5 text-sm tabular-nums"
        />
        <button
          onClick={() => mutation.mutate(amount)}
          disabled={mutation.isPending}
          className="rounded bg-bg-elevated px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {mutation.isPending ? "Depositing…" : "Deposit"}
        </button>
      </div>

      {mutation.error && <p className="text-xs text-loss">{mutation.error.message}</p>}
    </section>
  );
}
