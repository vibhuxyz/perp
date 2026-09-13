import { formatPrice } from '@/shared/lib/formatters';
import type { HoverData } from '../chartData';

export function LegendHover({ hoverData }: { hoverData: HoverData }) {
  const sign = (n: number) => (n >= 0 ? '+' : '');
  const closeColor = hoverData.isUp ? 'text-profit' : 'text-loss';

  return (
    <div className="flex items-center gap-3 whitespace-nowrap text-xs">
      <span className="text-text-secondary text-[10px]">{hoverData.time}</span>
      <span>
        O: <strong className="text-white">${formatPrice(hoverData.open)}</strong>
      </span>
      <span>
        H: <strong className="text-profit">${formatPrice(hoverData.high)}</strong>
      </span>
      <span>
        L: <strong className="text-loss">${formatPrice(hoverData.low)}</strong>
      </span>
      <span>
        C: <strong className={closeColor}>${formatPrice(hoverData.close)}</strong>
      </span>
      <span>
        Vol: <strong className="text-white">{hoverData.volume.toFixed(2)} BTC</strong>
      </span>
      <span className={`font-bold ${closeColor}`}>
        {sign(hoverData.change)}
        {hoverData.change.toFixed(1)} ({sign(hoverData.changePct)}
        {hoverData.changePct.toFixed(2)}%)
      </span>
    </div>
  );
}
