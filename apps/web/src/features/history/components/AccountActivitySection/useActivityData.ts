import { useMemo, useState } from 'react';
import type { FilterTab, SortDirection, SortField, StatementRecord, TimeframeFilter } from './types';

function matchesTab(tx: StatementRecord, activeFilter: FilterTab): boolean {
  if (activeFilter === 'deposits') return tx.type === 'deposit';
  if (activeFilter === 'margin') return tx.type === 'margin_locked';
  if (activeFilter === 'credits_debits') return tx.type === 'pnl_credit' || tx.type === 'pnl_debit';
  if (activeFilter === 'fees') return tx.type === 'fee' || tx.type === 'funding';
  return true;
}

function matchesSearch(tx: StatementRecord, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return (
    tx.title.toLowerCase().includes(q) || tx.description.toLowerCase().includes(q) || tx.refId.toLowerCase().includes(q)
  );
}

function matchesTimeframe(tx: StatementRecord, timeframe: TimeframeFilter): boolean {
  if (timeframe === 'today') {
    const todayStr = new Date().toISOString().slice(0, 10);
    return tx.timestamp.startsWith(todayStr);
  }
  return true;
}

function compareByField(a: StatementRecord, b: StatementRecord, field: SortField): number {
  if (field === 'date') return a.timestamp.localeCompare(b.timestamp);
  if (field === 'amount') return Math.abs(a.amount) - Math.abs(b.amount);
  return a.balance - b.balance;
}

function computeActivityTotals(transactions: StatementRecord[]) {
  let moneyAdded = 0;
  let onRampCount = 0;
  let marginUsed = 0;
  let realizedPnL = 0;
  let feesFunding = 0;

  for (const tx of transactions) {
    if (tx.type === 'deposit') {
      moneyAdded += tx.amount;
      onRampCount += 1;
    } else if (tx.type === 'margin_locked') {
      marginUsed += Math.abs(tx.amount);
    } else if (tx.type === 'pnl_credit' || tx.type === 'pnl_debit') {
      realizedPnL += tx.amount;
    } else if (tx.type === 'fee' || tx.type === 'funding') {
      feesFunding += Math.abs(tx.amount);
    }
  }

  return { moneyAdded, onRampCount, marginUsed, realizedPnL, feesFunding };
}

export function useActivityData(transactions: StatementRecord[], currentBalance?: number) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      all: transactions.length,
      deposits: transactions.filter(t => t.type === 'deposit').length,
      margin: transactions.filter(t => t.type === 'margin_locked').length,
      credits_debits: transactions.filter(t => t.type === 'pnl_credit' || t.type === 'pnl_debit').length,
      fees: transactions.filter(t => t.type === 'fee' || t.type === 'funding').length,
    }),
    [transactions],
  );

  const summaryMetrics = useMemo(() => {
    const totals = computeActivityTotals(transactions);
    return {
      ...totals,
      availableBalance: currentBalance !== undefined ? currentBalance : (transactions[0]?.balance ?? 0),
    };
  }, [transactions, currentBalance]);

  const handleCopyRef = (refId: string) => {
    navigator.clipboard.writeText(refId);
    setCopiedId(refId);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    return transactions
      .filter(tx => matchesTab(tx, activeFilter) && matchesSearch(tx, searchQuery) && matchesTimeframe(tx, timeframe))
      .sort((a, b) => {
        const cmp = compareByField(a, b, sortField);
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [transactions, activeFilter, searchQuery, timeframe, sortField, sortDir]);

  return {
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    timeframe,
    setTimeframe,
    sortField,
    sortDir,
    copiedId,
    counts,
    summaryMetrics,
    handleCopyRef,
    handleSortToggle,
    filteredAndSorted,
  };
}
