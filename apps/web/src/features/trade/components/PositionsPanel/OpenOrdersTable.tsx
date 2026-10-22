import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchOpenOrders, cancelOrderApi, type OpenOrder } from '@/features/trade/api/tradeApi';
import { useOptimisticOrdersStore, type OptimisticOrder } from '@/stores/optimistic-orders.store';
import { formatPrice } from '@/shared/lib/formatters';
import { Loader2, XCircle } from 'lucide-react';

function StatusBadge({ status, error }: { status: string; error?: string }) {
  if (status === 'Submitting') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-info/10 text-info border border-info/20 animate-pulse">
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
        <span>Submitting</span>
      </span>
    );
  }
  if (status === 'Accepted' || status === 'resting') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#00DA8E]/10 text-[#00DA8E] border border-[#00DA8E]/20">
        Accepted
      </span>
    );
  }
  if (status === 'Filled' || status === 'filled') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F7931A]/10 text-[#F7931A] border border-[#F7931A]/20">
        Filled
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-loss/10 text-loss border border-loss/20"
      title={error}
    >
      Rejected
    </span>
  );
}

export function OpenOrdersTable({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const optimisticOrders = useOptimisticOrdersStore(s => s.orders);
  const removeOptimistic = useOptimisticOrdersStore(s => s.removeOrder);

  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: serverOrders = [], isLoading } = useQuery({
    queryKey: ['orders', token],
    queryFn: fetchOpenOrders,
    enabled: Boolean(token),
    refetchInterval: 3_000,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ orderId, market }: { orderId: string; market: string }) => cancelOrderApi(orderId, market),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['equity'] });
      queryClient.invalidateQueries({ queryKey: ['depth'] });
    },
    onSettled: () => setCancellingId(null),
  });

  const serverOrderIds = new Set(serverOrders.map(o => o.orderId));
  const activeOptimistic = optimisticOrders.filter(o => !o.orderId || !serverOrderIds.has(o.orderId));

  const allOrders: Array<{
    id: string;
    orderId?: string;
    tempId?: string;
    market: string;
    side: 'LONG' | 'SHORT';
    type: string;
    quantity: string;
    price: string;
    status: string;
    errorMessage?: string;
    createdAt: string;
    isOptimistic: boolean;
  }> = [
    ...activeOptimistic.map((o: OptimisticOrder) => ({
      id: o.tempId,
      orderId: o.orderId,
      tempId: o.tempId,
      market: o.market,
      side: o.side,
      type: o.type,
      quantity: o.quantity,
      price: o.price,
      status: o.status,
      errorMessage: o.errorMessage,
      createdAt: new Date(o.createdAt).toLocaleTimeString(),
      isOptimistic: true,
    })),
    ...serverOrders.map((o: OpenOrder) => ({
      id: o.orderId,
      orderId: o.orderId,
      market: o.market,
      side: o.side,
      type: o.type,
      quantity: o.quantity,
      price: o.price,
      status: o.status,
      createdAt: new Date(o.createdAt).toLocaleTimeString(),
      isOptimistic: false,
    })),
  ];

  if (isLoading && allOrders.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-text-secondary text-xs">
        Loading open orders…
      </div>
    );
  }

  if (allOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="text-sm font-semibold text-text-secondary">No open orders</span>
        <span className="text-xs text-text-muted mt-1">Submitted limit orders will appear here</span>
      </div>
    );
  }

  const handleCancel = (item: typeof allOrders[0]) => {
    if (item.tempId && !item.orderId) {
      removeOptimistic(item.tempId);
      return;
    }
    const idToCancel = item.orderId ?? item.id;
    setCancellingId(idToCancel);
    cancelMutation.mutate({ orderId: idToCancel, market: item.market });
  };

  return (
    <table className="w-full text-left text-xs font-mono">
      <thead>
        <tr className="border-b border-border-subtle text-text-secondary text-[11px] font-medium font-sans">
          <th className="px-4 py-2.5">Time</th>
          <th className="px-3 py-2.5">Market</th>
          <th className="px-3 py-2.5">Side</th>
          <th className="px-3 py-2.5">Type</th>
          <th className="px-3 py-2.5">Size</th>
          <th className="px-3 py-2.5">Price</th>
          <th className="px-3 py-2.5">Status</th>
          <th className="px-4 py-2.5 text-right">Action</th>
        </tr>
      </thead>
      <tbody>
        {allOrders.map(o => {
          const isCancelling = cancellingId === (o.orderId ?? o.id);
          const isCancelDisabled = o.status === 'Submitting' || o.status === 'Filled' || isCancelling;

          return (
            <tr key={o.id} className="border-b border-border-subtle/40 hover:bg-bg-card-hover transition-colors">
              <td className="px-4 py-2.5 text-text-muted text-[11px]">{o.createdAt}</td>
              <td className="px-3 py-2.5 font-bold text-white">{o.market}</td>
              <td className="px-3 py-2.5">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  o.side === 'LONG' ? 'bg-[#00DA8E]/15 text-[#00DA8E]' : 'bg-loss/15 text-loss'
                }`}>
                  {o.side}
                </span>
              </td>
              <td className="px-3 py-2.5 text-text-secondary">{o.type}</td>
              <td className="px-3 py-2.5 text-white">{o.quantity}</td>
              <td className="px-3 py-2.5 text-white">${formatPrice(o.price)}</td>
              <td className="px-3 py-2.5">
                <StatusBadge status={o.status} error={o.errorMessage} />
              </td>
              <td className="px-4 py-2.5 text-right">
                <button
                  type="button"
                  disabled={isCancelDisabled}
                  onClick={() => handleCancel(o)}
                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded transition-colors cursor-pointer ${
                    isCancelDisabled
                      ? 'opacity-40 pointer-events-none text-text-muted'
                      : 'text-text-secondary hover:text-loss hover:bg-loss/10'
                  }`}
                >
                  <XCircle className="h-3 w-3" />
                  <span>{isCancelling ? 'Cancelling…' : 'Cancel'}</span>
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
