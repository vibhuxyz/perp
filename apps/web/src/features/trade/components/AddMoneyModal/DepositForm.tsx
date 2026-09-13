import { CheckCircle2, AlertCircle, Plus } from 'lucide-react';

function SubmitButtonContent({ isPending, isSuccess, amount }: { isPending: boolean; isSuccess: boolean; amount: string }) {
  if (isPending) return <span>Adding funds…</span>;
  if (isSuccess) return <span>Done!</span>;
  return (
    <>
      <Plus className="h-4 w-4" />
      <span>Add ${Number(amount || 0).toLocaleString()} Virtual Funds</span>
    </>
  );
}

export function DepositForm({
  amount,
  onAmountChange,
  onSubmit,
  isPending,
  isSuccess,
  errorMessage,
}: {
  amount: string;
  onAmountChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  isSuccess: boolean;
  errorMessage: string | null;
}) {
  const isDisabled = isPending || isSuccess || !amount || Number(amount) <= 0;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="custom-amount" className="block text-xs font-medium text-text-secondary">
          Deposit Amount (USDT)
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-4 text-text-secondary font-bold text-base">$</span>
          <input
            id="custom-amount"
            type="number"
            min="1"
            step="any"
            required
            value={amount}
            onChange={e => onAmountChange(e.target.value)}
            placeholder="10000"
            className="w-full rounded-xl bg-[#161B26] border border-[#232C3E] focus:border-[#7152FF] focus:ring-1 focus:ring-[#7152FF] pl-9 pr-4 py-2.5 text-base text-white font-mono placeholder-text-muted outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      {isSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-profit/30 bg-profit/10 p-3 text-xs text-profit">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="font-semibold">Funds added successfully! Balance updated.</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-loss/30 bg-loss/10 p-3 text-xs text-loss">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isDisabled}
        className="w-full rounded-xl bg-[#7152FF] hover:bg-[#6042EE] disabled:opacity-50 disabled:cursor-not-allowed py-3 text-sm sm:text-base font-bold text-white transition-all cursor-pointer shadow-lg shadow-[#7152FF]/25 flex items-center justify-center gap-2"
      >
        <SubmitButtonContent isPending={isPending} isSuccess={isSuccess} amount={amount} />
      </button>
    </form>
  );
}
