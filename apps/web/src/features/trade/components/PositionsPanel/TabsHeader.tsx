import { ChevronRight } from 'lucide-react';
import { TABS } from './tabs';

export function TabsHeader({
  activeTab,
  onSelect,
  positionsCount,
}: {
  activeTab: string;
  onSelect: (tab: string) => void;
  positionsCount: number;
}) {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between border-b border-border-subtle px-3 bg-bg-card">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className={[
              'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
              activeTab === tab.id
                ? 'bg-[#181F2E] text-white border border-[#26344B] font-bold shadow-xs'
                : 'text-[#8492A6] hover:text-white',
            ].join(' ')}
          >
            {tab.label}
            {tab.id === 'positions' && positionsCount > 0 && ` (${positionsCount})`}
          </button>
        ))}
      </div>

      <div className="flex items-center pl-2 shrink-0">
        <button type="button" className="p-1 text-text-secondary hover:text-white transition-colors cursor-pointer" title="Next tabs">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
