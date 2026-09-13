import { useState, useEffect } from 'react';
import { AddMoneyModal } from '@/features/trade/components/AddMoneyModal';
import { AccountActivitySection, type StatementRecord } from '@/features/history/components/AccountActivitySection';
import { MOCK_TRANSACTIONS } from './mockTransactions';
import { exportTransactionsCsv } from './exportCsv';
import { DemoDataNotice } from './DemoDataNotice';
import { PageHeader } from './PageHeader';

function loadStoredTransactions(): StatementRecord[] {
  try {
    const stored = localStorage.getItem('papertrade_statement_txs');
    return stored ? JSON.parse(stored) : MOCK_TRANSACTIONS;
  } catch {
    return MOCK_TRANSACTIONS;
  }
}

export default function HistoryPage() {
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isNoticeDismissed, setIsNoticeDismissed] = useState(false);
  const [transactions, setTransactions] = useState<StatementRecord[]>(loadStoredTransactions);

  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem('papertrade_statement_txs');
        if (stored) setTransactions(JSON.parse(stored));
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 bg-[#0A0D14] overflow-y-auto px-4 sm:px-6 pb-8 scroll-smooth">
      <PageHeader onExportCsv={() => exportTransactionsCsv(transactions)} onAddMoney={() => setIsDepositOpen(true)} />

      {!isNoticeDismissed && <DemoDataNotice onDismiss={() => setIsNoticeDismissed(true)} />}

      <AccountActivitySection transactions={transactions} />

      <AddMoneyModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
    </div>
  );
}
