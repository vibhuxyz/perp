import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deposit, fetchEquity } from '@/features/trade/api/tradeApi';
import { formatPrice } from '@/shared/lib/formatters';
import { useAccountStore } from '@/stores/account.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FlaskConical, CheckCircle, AlertCircle } from 'lucide-react';

const QUICK_AMOUNTS = ['10000', '50000', '100000', '1000000'];

export default function DepositPage() {
  const [amount, setAmount] = useState('100000');
  const queryClient         = useQueryClient();
  const token               = useAccountStore(s => s.token);

  const { data: equity, isLoading: equityLoading } = useQuery({
    queryKey: ['equity', token],
    queryFn: fetchEquity,
    enabled: Boolean(token),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: deposit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equity'] }),
  });

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4 text-center">
        <FlaskConical className="h-8 w-8 text-brand/60" />
        <p className="text-sm text-text-secondary">Sign in to manage your virtual balance.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-text-primary">Virtual balance</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Add practice funds to your simulator account. No real money is involved.
        </p>
      </div>

      {/* Balance overview */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Account balance</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-text-secondary font-medium mb-1">
                Available
              </dt>
              <dd className="text-xl font-bold tabular-nums text-text-primary">
                {equityLoading
                  ? <Skeleton className="h-7 w-28" />
                  : `$${formatPrice(equity?.availableBalance)}`}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-text-secondary font-medium mb-1">
                Margin locked
              </dt>
              <dd className="text-xl font-bold tabular-nums text-text-secondary">
                {equityLoading
                  ? <Skeleton className="h-7 w-20" />
                  : `$${formatPrice(equity?.marginLocked)}`}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Add funds */}
      <Card>
        <CardHeader>
          <CardTitle>Add virtual funds</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(a)}
                className={[
                  'rounded-lg py-2 text-xs font-medium transition-colors',
                  amount === a
                    ? 'bg-brand/20 text-brand border border-brand/30'
                    : 'bg-bg-elevated text-text-secondary hover:text-text-primary border border-transparent',
                ].join(' ')}
              >
                ${Number(a).toLocaleString()}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="grid gap-1.5">
            <label htmlFor="deposit-amount" className="text-xs font-medium text-text-secondary">
              Custom amount (USD)
            </label>
            <div className="flex gap-2">
              <Input
                id="deposit-amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                type="number"
                min="1"
                className="flex-1 tabular-nums"
                placeholder="Enter amount"
              />
              <Button
                variant="brand"
                onClick={() => mutation.mutate(amount)}
                disabled={mutation.isPending || !amount}
              >
                {mutation.isPending ? 'Adding…' : 'Add funds'}
              </Button>
            </div>
          </div>

          {mutation.error && (
            <div className="flex items-center gap-2 rounded-lg bg-loss/10 border border-loss/25 p-3 text-xs text-loss">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {mutation.error.message}
            </div>
          )}
          {mutation.data && (
            <div className="flex items-center gap-2 rounded-lg bg-profit/10 border border-profit/25 p-3 text-xs text-profit">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Funds added successfully! Your virtual balance has been updated.
            </div>
          )}

          <p className="text-[11px] text-text-secondary/60 flex items-center gap-1">
            <FlaskConical className="h-3 w-3" />
            This is virtual money for practice only. No real funds are involved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
