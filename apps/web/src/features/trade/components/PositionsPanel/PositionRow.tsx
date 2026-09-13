import { MoreHorizontal } from 'lucide-react';
import Decimal from 'decimal.js';
import { unrealisedPnl } from '@/shared/lib/decimal';
import { formatPrice, formatSigned } from '@/shared/lib/formatters';
import type { Position } from '@/features/trade/api/tradeApi';

type PnlTone = 'profit' | 'loss' | 'flat';

const TONE_CLASS: Record<PnlTone, string> = {
  profit: 'text-profit',
  loss: 'text-loss',
  flat: 'text-text-secondary',
};

function computeRoe(pnl: Decimal, margin: string): string {
  try {
    const marginDec = new Decimal(margin);
    if (!marginDec.gt(0)) return '+0.0%';
    const roeDec = pnl.div(marginDec).times(100);
    return `${roeDec.gte(0) ? '+' : ''}${roeDec.toFixed(1)}%`;
  } catch {
    return '+0.0%';
  }
}

export function PositionRow({
  pos,
  markPrice,
  isClosing,
  onClose,
}: {
  pos: Position;
  markPrice: string | null;
  isClosing: boolean;
  onClose: (market: string) => void;
}) {
  const currentMark = markPrice ?? pos.averagePrice;
  const pnl = unrealisedPnl(pos.side, pos.averagePrice, currentMark, pos.quantity);
  const isLong = pos.side === 'LONG';
  const pnlTone: PnlTone = pnl.isPositive() ? 'profit' : pnl.isNegative() ? 'loss' : 'flat';
  const roe = computeRoe(pnl, pos.margin);

  return (
    <tr className="border-b border-border-subtle/50 hover:bg-bg-elevated/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F7931A] text-white">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.76 10.42c.31-.92.1-1.97-.56-2.61-.75-.73-1.89-.96-3.15-.98V5h-1.5v1.8H9.3V5H7.8v1.8H5.5v1.5h1.25c.34 0 .5.16.5.5v8.4c0 .34-.16.5-.5.5H5.5v1.5h2.3V22h1.5v-1.8h1.25V22h1.5v-1.8c2.4-.04 4.2-.7 4.57-2.6.28-1.46-.42-2.52-1.61-3.08 1.05-.48 1.68-1.45 1.55-4.1zm-4.71-2.22c1.4.02 2.6.35 2.6 1.7 0 1.25-1.07 1.6-2.6 1.6H9.3V8.2h1.75zm.35 9.1H9.3v-3.7h1.9c1.6 0 2.8.38 2.8 1.85 0 1.35-1.12 1.85-2.6 1.85z" />
            </svg>
          </div>
          <span className="font-bold text-white font-sans text-xs">{pos.market}</span>
        </div>
      </td>

      <td className="px-3 py-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
            isLong ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss'
          }`}
        >
          {isLong ? 'Long' : 'Short'}
        </span>
      </td>

      <td className="px-3 py-3 text-white font-bold tabular-nums">{pos.quantity} BTC</td>
      <td className="px-3 py-3 text-white tabular-nums">${formatPrice(pos.averagePrice)}</td>
      <td className="px-3 py-3 text-white tabular-nums">${formatPrice(currentMark)}</td>
      <td className="px-3 py-3 text-loss font-bold tabular-nums">${formatPrice(pos.liquidationPrice)}</td>

      <td className={`px-3 py-3 font-bold tabular-nums ${TONE_CLASS[pnlTone]}`}>{formatSigned(pnl)} USD</td>
      <td className={`px-3 py-3 font-bold tabular-nums ${TONE_CLASS[pnlTone]}`}>{roe}</td>

      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1.5 font-sans">
          <button
            type="button"
            disabled={isClosing}
            onClick={() => onClose(pos.market)}
            className="rounded-lg bg-[#182132] hover:bg-loss/20 hover:text-loss border border-[#233047] px-2.5 py-1 text-xs text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {isClosing ? 'Closing…' : 'Close'}
          </button>
          <button
            type="button"
            className="rounded-lg bg-[#182132] hover:bg-[#222E44] border border-[#233047] p-1 text-text-secondary hover:text-white transition-colors cursor-pointer"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
