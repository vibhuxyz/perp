import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Wallet } from 'lucide-react';
import { deposit } from '@/features/trade/api/tradeApi';
import { AmountPresets } from './AmountPresets';
import { DepositForm } from './DepositForm';
import { RecentPaymentsPanel } from './RecentPaymentsPanel';
import { INITIAL_RECENT_PAYMENTS, type RecentPayment } from './constants';

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: string;
}

function buildDepositRecord(amt: string): RecentPayment {
  return {
    id: `p-${Date.now()}`,
    date: 'Just now',
    title: 'Virtual Practice Deposit',
    amount: `+$${Number(amt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    status: 'Completed',
    ref: `TX-SIM-${Math.floor(10000 + Math.random() * 90000)}`,
  };
}

export function AddMoneyModal({ isOpen, onClose, currentBalance }: AddMoneyModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('10000');
  const [isSuccess, setIsSuccess] = useState(false);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>(INITIAL_RECENT_PAYMENTS);

  const mutation = useMutation({
    mutationFn: (amt: string) => deposit(amt),
    onSuccess: (_, amt) => {
      queryClient.invalidateQueries({ queryKey: ['equity'] });
      queryClient.invalidateQueries({ queryKey: ['accountActivity'] });
      setIsSuccess(true);
      setRecentPayments(prev => [buildDepositRecord(amt), ...prev.slice(0, 4)]);

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

  const handleNavigateToStatement = () => {
    onClose();
    navigate('/history');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add Practice Funds"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[560px] max-h-[90vh] overflow-y-auto scrollbar-thin rounded-3xl border border-[#1E2536] bg-[#0E121A] p-6 sm:p-8 shadow-2xl shadow-black/90 select-none">
        <button
          onClick={onClose}
          type="button"
          aria-label="Close dialog"
          className="absolute right-5 top-5 rounded-xl p-1.5 text-[#64748B] hover:text-white hover:bg-[#161B26] transition-colors cursor-pointer z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex justify-center mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-profit/10 border border-profit/20 text-profit shadow-lg shadow-profit/5">
            <Wallet className="h-6 w-6" />
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white text-center">Add Money</h2>
        <p className="text-xs sm:text-sm text-text-secondary text-center mt-1 mb-5">
          Deposit instant practice funds into your virtual account.
        </p>

        {currentBalance && (
          <div className="flex items-center justify-between rounded-2xl bg-[#141924] border border-[#202738] px-4 py-3 mb-4 text-xs sm:text-sm font-mono">
            <span className="text-text-secondary font-sans font-medium">Current Balance</span>
            <span className="text-white font-bold text-base">{currentBalance}</span>
          </div>
        )}

        <AmountPresets amount={amount} onSelect={setAmount} />

        <DepositForm
          amount={amount}
          onAmountChange={setAmount}
          onSubmit={handleDeposit}
          isPending={mutation.isPending}
          isSuccess={isSuccess}
          errorMessage={mutation.error ? mutation.error.message || 'Deposit failed' : null}
        />

        <RecentPaymentsPanel payments={recentPayments} onViewFullStatement={handleNavigateToStatement} />
      </div>
    </div>
  );
}
