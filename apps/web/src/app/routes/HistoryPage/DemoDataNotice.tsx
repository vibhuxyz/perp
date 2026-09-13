import { AlertTriangle, X } from 'lucide-react';

export function DemoDataNotice({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl bg-[#131722] border border-[#7152FF]/35 p-4 text-xs shadow-sm select-none shrink-0 transition-all duration-300 relative">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#7152FF]/20 text-[#A088FF]">
        <AlertTriangle className="h-4 w-4 text-[#A088FF]" />
      </div>
      <div className="flex flex-col gap-0.5 pr-8">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-xs">Simulated / Fake Data Notice</span>
          <span className="rounded bg-info/15 text-info px-2 py-0.5 text-[10px] font-mono font-semibold">UI PREVIEW ONLY</span>
        </div>
        <p className="text-text-secondary text-xs leading-relaxed mt-0.5">
          This account statement and transaction ledger displays <strong className="text-white">simulated fake data</strong>{' '}
          for UI demonstration and practice learning. It shows all money added to your wallet, margin used, and
          debited/credited transactions. Real-time persistent transaction logging is part of the Day 3–4 Rung roadmap.
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        title="Dismiss notice"
        className="absolute top-3.5 right-3.5 p-1 rounded-lg text-text-secondary hover:text-white hover:bg-[#1A2234] transition-colors cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
