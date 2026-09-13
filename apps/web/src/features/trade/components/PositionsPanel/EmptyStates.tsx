export function NoPositionsState({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="h-44 flex flex-col items-center justify-center text-center text-text-secondary text-xs gap-1.5">
      {isLoading ? (
        <span>Loading positions…</span>
      ) : (
        <>
          <span className="font-semibold text-white">No open positions</span>
          <span className="text-[11px]">Use the order panel to place a limit or market order.</span>
        </>
      )}
    </div>
  );
}

export function OtherTabEmptyState({ tabLabel, onViewHistory }: { tabLabel: string; onViewHistory: () => void }) {
  return (
    <div className="h-44 flex flex-col items-center justify-center text-center text-text-secondary text-xs gap-2">
      <span>No active records found for {tabLabel}.</span>
      <button
        type="button"
        onClick={onViewHistory}
        className="text-xs font-semibold text-[#7152FF] hover:text-[#9F85FF] hover:underline cursor-pointer"
      >
        View full Account Statement & Payment History →
      </button>
    </div>
  );
}
