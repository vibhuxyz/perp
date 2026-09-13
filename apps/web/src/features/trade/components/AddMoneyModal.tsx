import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Wallet, CheckCircle2, AlertCircle } from 'lucide-react';
import { deposit } from '@/features/trade/api/tradeApi';

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: string;
}

const PRESET_AMOUNTS = ['1000', '5000', '10000', '50000'];

export function AddMoneyModal({ isOpen, onClose, currentBalance }: AddMoneyModalProps) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('10000');
  const [isSuccess, setIsSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: (amt: string) => deposit(amt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equity'] });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    },
  });

  if (!isOpen) return null;

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    mutation.mutate(amount);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add Practice Funds"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[560px] rounded-3xl border border-[#1E2536] bg-[#0E121A] p-8 shadow-2xl shadow-black/90 select-none">
        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close dialog"
          className="absolute right-5 top-5 rounded-xl p-1.5 text-[#64748B] hover:text-white hover:bg-[#161B26] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Top Icon */}
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00F29D]/10 border border-[#00F29D]/20 text-[#00F29D] shadow-lg shadow-[#00F29D]/5">
            <Wallet className="h-6 w-6" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-white text-center">Add Money</h2>
        <p className="text-sm text-[#8492A6] text-center mt-1.5 mb-6">
          Deposit instant practice funds into your virtual account.
        </p>

        {/* Current Balance Display */}
        {currentBalance && (
          <div className="flex items-center justify-between rounded-2xl bg-[#141924] border border-[#202738] px-5 py-3.5 mb-5 text-sm font-mono">
            <span className="text-[#8492A6] font-sans font-medium">Current Balance</span>
            <span className="text-white font-bold text-base">{currentBalance}</span>
          </div>
        )}

        {/* Quick Amount Presets */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(preset)}
              className={[
                'rounded-xl py-3 text-sm font-semibold transition-all cursor-pointer border text-center',
                amount === preset
                  ? 'bg-[#7152FF] text-white border-[#7152FF] shadow-md shadow-[#7152FF]/20'
                  : 'bg-[#141924] text-[#8492A6] border-[#202738] hover:text-white hover:border-[#2D384E]',
              ].join(' ')}
            >
              +${Number(preset).toLocaleString()}
            </button>
          ))}
        </div>

        <form onSubmit={handleDeposit} className="space-y-5">
          {/* Custom Amount Input */}
          <div className="space-y-2">
            <label htmlFor="custom-amount" className="block text-xs font-medium text-[#8492A6]">
              Deposit Amount (USDT)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-[#8492A6] font-bold text-base">$</span>
              <input
                id="custom-amount"
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10000"
                className="w-full rounded-xl bg-[#161B26] border border-[#232C3E] focus:border-[#7152FF] focus:ring-1 focus:ring-[#7152FF] pl-9 pr-4 py-3 text-base text-white font-mono placeholder-[#556377] outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Success Message */}
          {isSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-[#00F29D]/30 bg-[#00F29D]/10 p-3 text-xs text-[#00F29D]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="font-semibold">Funds added successfully! Balance updated.</span>
            </div>
          )}

          {/* Error Message */}
          {mutation.error && (
            <div className="flex items-center gap-2 rounded-xl border border-[#FF4D5A]/30 bg-[#FF4D5A]/10 p-3 text-xs text-[#FF4D5A]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{mutation.error.message || 'Deposit failed'}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={mutation.isPending || isSuccess || !amount || Number(amount) <= 0}
            className="w-full rounded-xl bg-[#7152FF] hover:bg-[#6042EE] disabled:opacity-50 disabled:cursor-not-allowed py-3.5 text-base font-semibold text-white transition-all cursor-pointer shadow-lg shadow-[#7152FF]/25 flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <span>Adding funds…</span>
            ) : isSuccess ? (
              <span>Done!</span>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span>Add ${Number(amount || 0).toLocaleString()} Virtual Funds</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
