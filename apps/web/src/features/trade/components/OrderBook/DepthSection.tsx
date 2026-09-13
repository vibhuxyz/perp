export interface DepthRow {
  price: string;
  size: string;
  total: string;
  depthPercent: number;
}

export function DepthSection({ side, rows, emptyLabel }: { side: 'ask' | 'bid'; rows: DepthRow[]; emptyLabel: string }) {
  const colorClass = side === 'ask' ? 'text-loss' : 'text-profit';
  const barClass = side === 'ask' ? 'bg-loss/20' : 'bg-profit/20';

  if (rows.length === 0) {
    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-none py-0.5">
        <div className="flex-1 flex items-center justify-center p-3 text-center text-[11px] text-text-secondary">
          {emptyLabel}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-none py-0.5">
      {rows.map((row, i) => (
        <div
          key={`${side}-${row.price}-${i}`}
          className="relative grid grid-cols-3 px-3 py-[2.5px] text-xs font-mono tabular-nums hover:bg-[#151D2C] cursor-pointer group"
        >
          <div
            className={`absolute top-0 bottom-0 right-0 pointer-events-none transition-all ${barClass}`}
            style={{ width: `${row.depthPercent}%` }}
          />
          <span className={`text-left font-medium z-10 ${colorClass}`}>${row.price}</span>
          <span className="text-right text-white/90 z-10">{row.size}</span>
          <span className="text-right text-white/90 z-10">{row.total}</span>
        </div>
      ))}
    </div>
  );
}
