const TABS = ['LIMIT', 'MARKET', 'STOP'] as const;
type OrderTypeTab = (typeof TABS)[number];

export function OrderTypeTabs({
  selected,
  onSelect,
}: {
  selected: OrderTypeTab;
  onSelect: (tab: OrderTypeTab) => void;
}) {
  return (
    <div className="flex items-center bg-[#0D131F] border border-[#182234] rounded-lg p-0.5">
      {TABS.map(type => {
        const isSelected = selected === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={[
              'flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer text-center',
              isSelected
                ? 'bg-[#1A2539] text-white font-bold shadow-xs border-b-2 border-[#3B82F6]'
                : 'text-[#8492A6] hover:text-white',
            ].join(' ')}
          >
            {type.charAt(0) + type.slice(1).toLowerCase()}
          </button>
        );
      })}
    </div>
  );
}
