import { FileText, Search, X } from 'lucide-react';
import { TimeframeDropdown } from './TimeframeDropdown';
import type { TimeframeFilter } from './types';

export function ActivityHeader({
  timeframe,
  onSelectTimeframe,
  searchQuery,
  onSearchChange,
}: {
  timeframe: TimeframeFilter;
  onSelectTimeframe: (tf: TimeframeFilter) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 pb-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#101726] border border-[#1E293B] text-[#8E9DB2] shadow-sm">
          <FileText className="h-6 w-6 stroke-[1.75]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight leading-tight">Account Activity</h2>
          <p className="text-xs sm:text-sm text-[#7E8B9F] mt-1 leading-relaxed">
            View all changes to your virtual account, including deposits, margin usage, PnL, fees and funding.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <TimeframeDropdown timeframe={timeframe} onSelect={onSelectTimeframe} />

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111827] border border-[#1E293B] focus-within:border-info/60 transition-colors w-48 sm:w-60">
          <Search className="h-4 w-4 text-[#7E8B9F] shrink-0" />
          <input
            type="text"
            placeholder="Search statement..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder:text-text-muted focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="text-[#7E8B9F] hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
