import { MoreHorizontal } from 'lucide-react';
import Decimal from 'decimal.js';
import { unrealisedPnl } from '@/shared/lib/decimal';
import { formatPrice, formatSigned } from '@/shared/lib/formatters';
import type { Position } from '@/features/trade/api/tradeApi';
import { MarketIcon } from '../CryptoIcon';

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
  const baseAsset = pos.market.replace(/-PERP$/i, '');

  return (
    <tr className="border-b border-border-subtle/50 hover:bg-bg-elevated/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <MarketIcon symbol={pos.market} className="h-5 w-5" />
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

      <td className="px-3 py-3 text-white font-bold tabular-nums">
        {pos.quantity} {baseAsset}
      </td>
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
