import type { FilterTab } from './types';

export function CategoryTabs({
  tabs,
  activeFilter,
  onSelect,
}: {
  tabs: { id: FilterTab; label: string; count: number }[];
  activeFilter: FilterTab;
  onSelect: (tab: FilterTab) => void;
}) {
  return (
    <div className="flex items-center gap-2 px-6 overflow-x-auto scrollbar-none">
      {tabs.map(tab => {
        const isActive = activeFilter === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className={`relative px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap rounded-t-lg ${
              isActive ? 'bg-[#131C2D] text-white font-bold' : 'text-[#7E8B9F] hover:text-white hover:bg-[#0E1522]'
            }`}
          >
            <span>
              {tab.label} ({tab.count})
            </span>
            {isActive && <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-info rounded-full shadow-[0_0_8px_#00D2FF]" />}
          </button>
        );
      })}
    </div>
  );
}
