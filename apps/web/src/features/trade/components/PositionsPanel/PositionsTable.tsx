import { ArrowUpDown } from 'lucide-react';
import { PositionRow } from './PositionRow';
import type { Position } from '@/features/trade/api/tradeApi';

export function PositionsTable({
  positions,
  markPrice,
  isClosing,
  onClose,
}: {
  positions: Position[];
  markPrice: string | null;
  isClosing: boolean;
  onClose: (market: string) => void;
}) {
  return (
    <table className="w-full text-left text-xs font-mono">
      <thead>
        <tr className="border-b border-border-subtle text-text-secondary text-[11px] font-medium font-sans">
          <th className="px-4 py-2.5">
            <div className="flex items-center gap-1">
              <span>Market</span>
              <ArrowUpDown className="h-3 w-3 opacity-60" />
            </div>
          </th>
          <th className="px-3 py-2.5">Side</th>
          <th className="px-3 py-2.5">Size</th>
          <th className="px-3 py-2.5">Entry Price</th>
          <th className="px-3 py-2.5">Mark Price</th>
          <th className="px-3 py-2.5">Liq. Price</th>
          <th className="px-3 py-2.5">
            <div className="flex items-center gap-1">
              <span>Unrealized PnL</span>
              <ArrowUpDown className="h-3 w-3 opacity-60" />
            </div>
          </th>
          <th className="px-3 py-2.5">
            <div className="flex items-center gap-1">
              <span>ROE</span>
              <ArrowUpDown className="h-3 w-3 opacity-60" />
            </div>
          </th>
          <th className="px-4 py-2.5 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {positions.map((pos, idx) => (
          <PositionRow key={`${pos.market}-${idx}`} pos={pos} markPrice={markPrice} isClosing={isClosing} onClose={onClose} />
        ))}
      </tbody>
    </table>
  );
}
