import type { StatementRecord } from '@/features/history/components/AccountActivitySection';

const HEADERS = ['Ref ID', 'Timestamp', 'Category', 'Description', 'Amount (USD)', 'Balance After (USD)', 'Status'];

export function exportTransactionsCsv(transactions: StatementRecord[]) {
  const rows = transactions.map(tx => [
    tx.refId,
    tx.timestamp,
    tx.category,
    `"${tx.title} - ${tx.description}"`,
    tx.amount.toFixed(2),
    tx.balance.toFixed(2),
    tx.status,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [HEADERS.join(','), ...rows.map(e => e.join(','))].join('\n');
  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csvContent));
  link.setAttribute('download', `account_statement_simulated_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
