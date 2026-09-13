export interface StatementRecord {
  id: string;
  timestamp: string;
  type: 'deposit' | 'margin_locked' | 'pnl_credit' | 'pnl_debit' | 'fee' | 'funding';
  title: string;
  description: string;
  category: 'Added' | 'Margin' | 'Credit' | 'Debit' | 'Fee';
  amount: number;
  balance: number;
  status: 'Completed' | 'Settled';
  refId: string;
}

export type FilterTab = 'all' | 'deposits' | 'margin' | 'credits_debits' | 'fees';
export type TimeframeFilter = 'all' | 'today' | '7d' | '30d';
export type SortField = 'date' | 'amount' | 'balance';
export type SortDirection = 'asc' | 'desc';
