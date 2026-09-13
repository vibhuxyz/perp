import { Download, Plus } from 'lucide-react';

export function PageHeader({ onExportCsv, onAddMoney }: { onExportCsv: () => void; onAddMoney: () => void }) {
  return (
    <div className="pt-4 sm:pt-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 transition-opacity duration-300">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold text-white tracking-tight">Account Statement & Payment History</h1>
          <span className="rounded-full bg-[#7152FF]/20 border border-[#7152FF]/40 text-[#A088FF] px-2.5 py-0.5 text-[11px] font-bold">
            Simulated Ledger
          </span>
        </div>
        <p className="text-xs text-text-secondary mt-1">
          Review money added to your wallet, margin used, and all credited & debited settlements.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onExportCsv}
          className="flex items-center gap-1.5 rounded-xl bg-[#141924] hover:bg-bg-hover border border-[#20293C] text-white px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 text-text-secondary" />
          <span>Export CSV</span>
        </button>

        <button
          type="button"
          onClick={onAddMoney}
          className="flex items-center gap-1.5 rounded-xl bg-[#7152FF] hover:bg-[#6042EE] text-white px-4 py-2 text-xs font-bold shadow-md shadow-[#7152FF]/20 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Practice Money</span>
        </button>
      </div>
    </div>
  );
}
