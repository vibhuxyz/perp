export function OrderValueInput({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-text-secondary">Order Value</span>
      <div className="flex items-center justify-between rounded-xl bg-[#141924] border border-[#1E2638]/70 px-3.5 py-2.5 focus-within:border-[#3B82F6] transition-colors">
        <input
          id="order-value"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="0"
          className="w-full bg-transparent text-base font-semibold text-white font-mono tabular-nums placeholder:text-text-muted border-none outline-none ring-0 shadow-none focus:border-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
        />
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white font-bold text-xs shadow-xs ml-2 select-none">
          $
        </div>
      </div>
    </div>
  );
}
