import { CheckCircle2, Copy, Check } from 'lucide-react';
import { formatSecondaryDate } from './dateFormat';
import { TypeBadge } from './TypeBadge';
import { AmountCell } from './AmountCell';
import type { StatementRecord } from './types';

export function TransactionRow({
  tx,
  isCopied,
  onCopyRef,
}: {
  tx: StatementRecord;
  isCopied: boolean;
  onCopyRef: (refId: string) => void;
}) {
  return (
    <div className="flex items-center px-6 py-4 hover:bg-[#0E1524]/60 transition-colors">
      <div className="w-[18%] min-w-[150px] whitespace-nowrap">
        <div className="text-xs font-mono font-medium text-white tabular-nums">{tx.timestamp}</div>
        <div className="text-[11px] text-[#7E8B9F] mt-0.5 font-sans">{formatSecondaryDate(tx.timestamp)}</div>
      </div>

      <div className="w-[12%] min-w-[90px] whitespace-nowrap font-sans">
        <TypeBadge type={tx.type} />
      </div>

      <div className="flex-1 min-w-[200px] font-sans pr-4">
        <div className="text-xs sm:text-sm font-semibold text-white">{tx.title}</div>
        <div className="text-[11px] text-[#7E8B9F] mt-0.5">{tx.description}</div>
      </div>

      <div className="w-[14%] min-w-[110px] text-right whitespace-nowrap tabular-nums">
        <AmountCell tx={tx} />
      </div>

      <div className="w-[14%] min-w-[110px] text-right whitespace-nowrap font-mono text-xs sm:text-sm text-white font-medium tabular-nums">
        ${tx.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>

      <div className="w-[10%] min-w-[90px] whitespace-nowrap font-sans pl-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-profit/10 border border-profit/20 text-profit text-xs font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>{tx.status}</span>
        </span>
      </div>

      <div className="w-[12%] min-w-[110px] text-right whitespace-nowrap font-mono">
        <div className="inline-flex items-center justify-end gap-2 text-xs text-[#7E8B9F]">
          <span>{tx.refId}</span>
          <button
            type="button"
            onClick={() => onCopyRef(tx.refId)}
            className="p-1 rounded hover:bg-[#162133] hover:text-white transition-colors cursor-pointer"
            title="Copy Reference ID"
          >
            {isCopied ? <Check className="h-3.5 w-3.5 text-profit" /> : <Copy className="h-3.5 w-3.5 text-[#7E8B9F] hover:text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}
