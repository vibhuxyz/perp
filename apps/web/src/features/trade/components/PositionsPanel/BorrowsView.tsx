import { useQuery } from '@tanstack/react-query';
import { fetchEquity, fetchPositions, type Position } from '@/features/trade/api/tradeApi';
import { ShieldCheck, Info } from 'lucide-react';

export function BorrowsView({ token }: { token: string }) {
  const { data: equity } = useQuery({
    queryKey: ['equity', token],
    queryFn: fetchEquity,
    enabled: Boolean(token),
  });

  const { data: positions = [] } = useQuery({
    queryKey: ['positions', token],
    queryFn: fetchPositions,
    enabled: Boolean(token),
  });

  const available = equity ? Number(equity.availableBalance).toLocaleString() : '0';
  const locked = equity ? Number(equity.marginLocked).toLocaleString() : '0';

  const borrowedNotional = positions.reduce((acc: number, p: Position) => {
    const notional = Number(p.quantity) * Number(p.averagePrice);
    const margin = Number(p.margin);
    return acc + Math.max(0, notional - margin);
  }, 0);

  return (
    <div className="p-6 flex flex-col gap-5 select-none font-sans text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-3.5 rounded-xl bg-bg-card-hover border border-border-subtle flex flex-col gap-1">
          <span className="text-text-muted text-[11px] font-sans">Available Collateral</span>
          <span className="text-white text-base font-bold">${available} USD</span>
        </div>
        <div className="p-3.5 rounded-xl bg-bg-card-hover border border-border-subtle flex flex-col gap-1">
          <span className="text-text-muted text-[11px] font-sans">Locked Margin</span>
          <span className="text-white text-base font-bold">${locked} USD</span>
        </div>
        <div className="p-3.5 rounded-xl bg-bg-card-hover border border-border-subtle flex flex-col gap-1">
          <span className="text-text-muted text-[11px] font-sans">Active Borrow Exposure</span>
          <span className="text-info text-base font-bold">${borrowedNotional.toLocaleString()} USD</span>
        </div>
        <div className="p-3.5 rounded-xl bg-bg-card-hover border border-border-subtle flex flex-col gap-1">
          <span className="text-text-muted text-[11px] font-sans">Borrow Interest Rate</span>
          <span className="text-profit text-base font-bold">0.00% / hr</span>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl bg-profit/10 border border-profit/20 text-profit">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span className="text-xs">
          Zero borrow fees: Margin financing for resting and active isolated positions is completely subsidised by the exchange insurance fund.
        </span>
      </div>

      <div className="flex items-center gap-2 text-text-muted text-[11px]">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>Borrow limits scale dynamically with your deposited collateral and selected order leverage.</span>
      </div>
    </div>
  );
}
