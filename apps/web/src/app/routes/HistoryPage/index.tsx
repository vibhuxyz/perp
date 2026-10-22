import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AddMoneyModal } from '@/features/trade/components/AddMoneyModal';
import { AccountActivitySection, type StatementRecord } from '@/features/history/components/AccountActivitySection';
import { fetchAccountActivity } from '@/features/trade/api/tradeApi';
import { useAccountStore } from '@/stores/account.store';
import { MOCK_TRANSACTIONS } from './mockTransactions';
import { exportTransactionsCsv } from './exportCsv';
import { PageHeader } from './PageHeader';

export default function HistoryPage() {
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const token = useAccountStore(s => s.token);

  const { data: serverTransactions } = useQuery({
    queryKey: ['accountActivity', token],
    queryFn: fetchAccountActivity,
    enabled: Boolean(token),
    refetchInterval: 5_000,
  });

  const transactions: StatementRecord[] =
    serverTransactions && serverTransactions.length > 0
      ? serverTransactions
      : MOCK_TRANSACTIONS;

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 bg-[#0A0D14] overflow-y-auto px-4 sm:px-6 pb-8 scroll-smooth">
      <PageHeader onExportCsv={() => exportTransactionsCsv(transactions)} onAddMoney={() => setIsDepositOpen(true)} />
      <AccountActivitySection transactions={transactions} />
      <AddMoneyModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
    </div>
  );
}
