import { ChevronsUpDown } from 'lucide-react';
import type { SortField } from './types';

function SortableHeader({
  label,
  field,
  align,
  onSort,
}: {
  label: string;
  field: SortField;
  align: 'left' | 'right';
  onSort: (field: SortField) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group ${
        align === 'right' ? 'justify-end' : ''
      }`}
    >
      <span>{label}</span>
      <ChevronsUpDown className="h-3.5 w-3.5 text-text-muted group-hover:text-white" />
    </button>
  );
}

export function ColumnHeaders({ onSort }: { onSort: (field: SortField) => void }) {
  return (
    <div className="flex items-center px-6 py-3 border-t border-[#172234] text-[#7E8B9F] text-[11px] font-sans font-medium bg-[#0A0F1A]">
      <div className="w-[18%] min-w-[150px]">
        <SortableHeader label="Date & Time" field="date" align="left" onSort={onSort} />
      </div>
      <div className="w-[12%] min-w-[90px]">Type</div>
      <div className="flex-1 min-w-[200px]">Description</div>
      <div className="w-[14%] min-w-[110px] text-right">
        <SortableHeader label="Amount (USD)" field="amount" align="right" onSort={onSort} />
      </div>
      <div className="w-[14%] min-w-[110px] text-right">
        <SortableHeader label="Balance After" field="balance" align="right" onSort={onSort} />
      </div>
      <div className="w-[10%] min-w-[90px] pl-2">Status</div>
      <div className="w-[12%] min-w-[110px] text-right">Reference ID</div>
    </div>
  );
}
