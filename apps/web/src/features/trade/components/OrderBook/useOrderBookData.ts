import { useMemo } from 'react';
import Decimal from 'decimal.js';
import { formatPrice, formatSize } from '@/shared/lib/formatters';
import type { Level } from '@/stores/market.store';
import type { ViewMode } from './ViewModeButtons';
import type { DepthRow } from './DepthSection';

function buildDepthRows(levels: Level[], limit: number): DepthRow[] {
  if (levels.length === 0) return [];

  let running = new Decimal(0);
  const totals: Decimal[] = [];
  const slice = levels.slice(0, limit);

  for (const level of slice) {
    running = running.plus(level.quantity);
    totals.push(running);
  }

  const maxTotal = running.gt(0) ? running : new Decimal(1);

  return slice.map((level, i) => {
    const total = totals[i] ?? new Decimal(0);
    return {
      price: formatPrice(level.price),
      size: formatSize(level.quantity),
      total: formatSize(total.toString()),
      depthPercent: Math.min(100, Math.round(total.div(maxTotal).times(100).toNumber())),
    };
  });
}

export function useOrderBookData(storeAsks: Level[], storeBids: Level[], viewMode: ViewMode) {
  const asksData = useMemo(
    () => buildDepthRows(storeAsks, viewMode === 'asks' ? 20 : 10),
    [storeAsks, viewMode],
  );

  const bidsData = useMemo(
    () => buildDepthRows(storeBids, viewMode === 'bids' ? 20 : 10),
    [storeBids, viewMode],
  );

  const { bidPercent, askPercent, hasLiquidity } = useMemo(() => {
    const totalBids = storeBids.reduce((sum, b) => sum.plus(b.quantity), new Decimal(0));
    const totalAsks = storeAsks.reduce((sum, a) => sum.plus(a.quantity), new Decimal(0));
    const totalLiquidity = totalBids.plus(totalAsks);

    if (totalLiquidity.isZero()) {
      return { bidPercent: 0, askPercent: 0, hasLiquidity: false };
    }

    const bPct = Math.round(totalBids.div(totalLiquidity).times(100).toNumber());
    return { bidPercent: bPct, askPercent: 100 - bPct, hasLiquidity: true };
  }, [storeBids, storeAsks]);

  return { asksData, bidsData, bidPercent, askPercent, hasLiquidity };
}
