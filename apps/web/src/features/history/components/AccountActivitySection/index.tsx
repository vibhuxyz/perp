import { SummaryMetricsGrid } from './SummaryMetricsGrid';
import { ActivityHeader } from './ActivityHeader';
import { CategoryTabs } from './CategoryTabs';
import { ColumnHeaders } from './ColumnHeaders';
import { TransactionRow } from './TransactionRow';
import { useActivityData } from './useActivityData';
import type { FilterTab, StatementRecord } from './types';

export type { StatementRecord, FilterTab, TimeframeFilter, SortField, SortDirection } from './types';

interface AccountActivitySectionProps {
  transactions: StatementRecord[];
  currentBalance?: number;
}

export function AccountActivitySection({ transactions, currentBalance }: AccountActivitySectionProps) {
  const {
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    timeframe,
    setTimeframe,
    copiedId,
    counts,
    summaryMetrics,
    handleCopyRef,
    handleSortToggle,
    filteredAndSorted,
  } = useActivityData(transactions, currentBalance);

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'deposits', label: 'Money Added', count: counts.deposits },
    { id: 'margin', label: 'Margin Used', count: counts.margin },
    { id: 'credits_debits', label: 'PnL Credits & Debits', count: counts.credits_debits },
    { id: 'fees', label: 'Fees & Funding', count: counts.fees },
  ];

  return (
    <div className="flex flex-col select-none">
      <div className="sticky top-0 z-30 bg-[#0A0D14] pt-2 pb-0 flex flex-col gap-3">
        <SummaryMetricsGrid {...summaryMetrics} />

        <div className="rounded-t-2xl border-t border-x border-b border-[#172234] bg-[#0A0F1A] shadow-md flex flex-col">
          <ActivityHeader
            timeframe={timeframe}
            onSelectTimeframe={setTimeframe}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <CategoryTabs tabs={tabs} activeFilter={activeFilter} onSelect={setActiveFilter} />
          <ColumnHeaders onSort={handleSortToggle} />
        </div>
      </div>

      <div className="rounded-b-2xl border-b border-x border-[#172234] bg-[#0A0F1A] divide-y divide-[#141C2B] font-mono text-xs shadow-xl">
        {filteredAndSorted.length > 0 ? (
          filteredAndSorted.map(tx => (
            <TransactionRow key={tx.id} tx={tx} isCopied={copiedId === tx.refId} onCopyRef={handleCopyRef} />
          ))
        ) : (
          <div className="py-14 text-center text-[#7E8B9F] text-xs font-sans">No statement transactions match your criteria.</div>
        )}
      </div>
    </div>
  );
}
