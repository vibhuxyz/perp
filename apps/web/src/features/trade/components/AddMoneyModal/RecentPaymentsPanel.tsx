import { useState } from 'react';
import { Clock, ChevronDown, ArrowDownLeft, ExternalLink } from 'lucide-react';
import type { RecentPayment } from './constants';

function PaymentRow({ tx }: { tx: RecentPayment }) {
  return (
    <div className="flex items-center justify-between py-2 px-1 text-xs">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-profit/10 text-profit shrink-0">
          <ArrowDownLeft className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-white text-xs leading-tight">{tx.title}</span>
          <span className="text-[10px] text-[#6A7B95] font-mono leading-tight mt-0.5">
            {tx.date} · {tx.ref}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end shrink-0 pl-2">
        <span className="font-bold font-mono text-profit text-xs">{tx.amount}</span>
        <span className="text-[10px] text-profit font-medium leading-tight mt-0.5">{tx.status}</span>
      </div>
    </div>
  );
}

export function RecentPaymentsPanel({
  payments,
  onViewFullStatement,
}: {
  payments: RecentPayment[];
  onViewFullStatement: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-5 pt-3 border-t border-[#1C2538]">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center justify-between w-full rounded-xl bg-[#141924] hover:bg-[#192131] border border-[#20293C] px-4 py-2.5 text-xs text-text-secondary hover:text-white transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#7152FF]" />
          <span className="font-semibold text-white">See Recent Payment History</span>
          <span className="rounded-full bg-[#7152FF]/20 text-[#A088FF] px-2 py-0.5 text-[10px] font-mono font-bold">Last 5</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : ''}`} />
      </button>

      {isOpen && (
        <div className="mt-3 rounded-2xl bg-[#121622] border border-[#1F273A] p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[11px] text-text-secondary px-1 font-medium">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <span>Recent 5 Payments</span>
              <span className="text-[10px] font-normal text-text-muted">(Simulated)</span>
            </span>
            <button
              type="button"
              onClick={onViewFullStatement}
              className="flex items-center gap-1 text-[#7152FF] hover:text-[#9F85FF] hover:underline font-semibold cursor-pointer text-xs"
            >
              <span>Full Statement</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          <div className="flex flex-col divide-y divide-[#1A2234]">
            {payments.slice(0, 5).map(tx => (
              <PaymentRow key={tx.id} tx={tx} />
            ))}
          </div>

          <div className="pt-1 text-center">
            <p className="text-[10px] text-text-muted">⚠️ Simulated deposit ledger for demo testing.</p>
          </div>
        </div>
      )}
    </div>
  );
}
