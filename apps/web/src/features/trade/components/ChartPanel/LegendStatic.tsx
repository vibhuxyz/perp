import { formatPrice } from '@/shared/lib/formatters';
import type { CandlestickData } from '../chartData';

export function LegendStatic({
  lastTradePrice,
  indexPrice,
  effectivePrice,
  latestCandle,
}: {
  lastTradePrice: string | null;
  indexPrice: string | null;
  effectivePrice: number;
  latestCandle: CandlestickData | null;
}) {
  const lastDisplay = lastTradePrice ?? indexPrice ?? effectivePrice;
  const markDisplay = indexPrice ?? lastTradePrice ?? effectivePrice;
  const closeColor = latestCandle && latestCandle.close >= latestCandle.open ? 'text-profit' : 'text-loss';

  return (
    <div className="flex items-center gap-3 whitespace-nowrap">
      <span>
        Last: <strong className="text-white font-bold">${formatPrice(lastDisplay)}</strong>
      </span>
      <span>
        Mark: <strong className="text-profit font-bold">${formatPrice(markDisplay)}</strong>
      </span>
      {latestCandle && (
        <>
          <span>
            O: <span className="text-white font-medium">${formatPrice(latestCandle.open)}</span>
          </span>
          <span>
            H: <span className="text-profit font-medium">${formatPrice(latestCandle.high)}</span>
          </span>
          <span>
            L: <span className="text-loss font-medium">${formatPrice(latestCandle.low)}</span>
          </span>
          <span>
            C: <span className={`font-medium ${closeColor}`}>${formatPrice(latestCandle.close)}</span>
          </span>
        </>
      )}
    </div>
  );
}
