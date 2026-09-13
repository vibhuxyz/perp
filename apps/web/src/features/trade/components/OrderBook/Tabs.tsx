export function Tabs({
  activeTab,
  tradeCount,
  onSelect,
}: {
  activeTab: 'book' | 'trades';
  tradeCount: number;
  onSelect: (tab: 'book' | 'trades') => void;
}) {
  return (
    <div className="flex h-11 shrink-0 items-center px-3 gap-2 bg-bg-card border-b border-border-subtle">
      <button
        type="button"
        onClick={() => onSelect('book')}
        className={[
          'rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs',
          activeTab === 'book' ? 'bg-[#181F2E] text-white border border-[#26344B]' : 'text-[#8492A6] hover:text-white',
        ].join(' ')}
      >
        Book
      </button>
      <button
        type="button"
        onClick={() => onSelect('trades')}
        className={[
          'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer',
          activeTab === 'trades'
            ? 'bg-[#181F2E] text-white border border-[#26344B]'
            : 'text-[#8492A6] hover:text-white',
        ].join(' ')}
      >
        Trades ({tradeCount})
      </button>
    </div>
  );
}
