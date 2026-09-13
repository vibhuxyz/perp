import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import type { TimeframeFilter } from './types';

const TIMEFRAME_OPTIONS: TimeframeFilter[] = ['all', 'today', '7d', '30d'];

const TIMEFRAME_LABELS: Record<TimeframeFilter, string> = {
  all: 'All time',
  today: 'Today',
  '7d': 'Past 7 days',
  '30d': 'Past 30 days',
};

export function TimeframeDropdown({
  timeframe,
  onSelect,
}: {
  timeframe: TimeframeFilter;
  onSelect: (tf: TimeframeFilter) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111827] border border-[#1E293B] text-xs font-medium text-white hover:bg-[#162134] hover:border-[#27374F] transition-all cursor-pointer whitespace-nowrap"
      >
        <Calendar className="h-4 w-4 text-[#7E8B9F]" />
        <span>{TIMEFRAME_LABELS[timeframe]}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-[#7E8B9F] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-[#111827] border border-[#1E293B] shadow-2xl py-1 z-30 text-xs">
          {TIMEFRAME_OPTIONS.map(tf => (
            <button
              key={tf}
              type="button"
              onClick={() => {
                onSelect(tf);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 hover:bg-[#1A2438] transition-colors cursor-pointer ${
                timeframe === tf ? 'text-info font-semibold bg-[#141E30]' : 'text-text-secondary'
              }`}
            >
              {TIMEFRAME_LABELS[tf]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
