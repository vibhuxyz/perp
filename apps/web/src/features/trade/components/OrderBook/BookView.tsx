import { useState } from 'react';
import { useMarketStore } from '@/stores/market.store';
import { formatPrice } from '@/shared/lib/formatters';
import Decimal from 'decimal.js';
import { ViewModeButtons, type ViewMode } from './ViewModeButtons';
import { PrecisionStepper } from './PrecisionStepper';
import { DepthSection } from './DepthSection';
import { MidPriceBanner } from './MidPriceBanner';
import { DepthRatioBar } from './DepthRatioBar';
import { useOrderBookData } from './useOrderBookData';

const PRECISION_STEPS = ['0.01', '0.1', '1', '5', '10'];

function computeMidPrice(bestBid: string | undefined, bestAsk: string | undefined, lastTradePrice: string | null): string {
  if (bestBid && bestAsk) return formatPrice(new Decimal(bestBid).plus(bestAsk).div(2).toString());
  return lastTradePrice ? formatPrice(lastTradePrice) : '—';
}

interface BookViewProps {
  baseAsset: string;
}

export function BookView({ baseAsset }: BookViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [precisionIndex, setPrecisionIndex] = useState(1);

  const storeBids = useMarketStore(s => s.bids);
  const storeAsks = useMarketStore(s => s.asks);
  const lastTradePrice = useMarketStore(s => s.lastTradePrice);
  const indexPrice = useMarketStore(s => s.indexPrice);

  const precision = PRECISION_STEPS[precisionIndex] ?? '0.1';

  const handleStepDown = () => setPrecisionIndex(prev => Math.max(0, prev - 1));
  const handleStepUp = () => setPrecisionIndex(prev => Math.min(PRECISION_STEPS.length - 1, prev + 1));

  const { asksData, bidsData, bidPercent, askPercent, hasLiquidity } = useOrderBookData(storeAsks, storeBids, viewMode);

  const midPrice = computeMidPrice(storeBids[0]?.price, storeAsks[0]?.price, lastTradePrice);
  const markPriceDisplay = indexPrice ? formatPrice(indexPrice) : '—';
  const showAsks = viewMode === 'all' || viewMode === 'asks';
  const showBids = viewMode === 'all' || viewMode === 'bids';

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex h-9 shrink-0 items-center justify-between px-3 bg-[#0C1018] border-b border-border-subtle/70">
        <ViewModeButtons viewMode={viewMode} onSelect={setViewMode} />
        <PrecisionStepper precision={precision} onStepDown={handleStepDown} onStepUp={handleStepUp} />
      </div>

      <div className="grid grid-cols-3 h-7 shrink-0 items-center px-3 text-[11px] text-text-secondary font-medium border-b border-border-subtle/60 bg-[#0C1018]">
        <span className="text-left font-sans">Price (USD)</span>
        <span className="text-right font-sans">Size ({baseAsset})</span>
        <span className="text-right font-sans">Total ({baseAsset})</span>
      </div>

      {showAsks && <DepthSection side="ask" rows={asksData} emptyLabel="No resting asks in book" />}

      <MidPriceBanner midPrice={midPrice} markPriceDisplay={markPriceDisplay} />

      {showBids && <DepthSection side="bid" rows={bidsData} emptyLabel="No resting bids in book" />}

      <DepthRatioBar hasLiquidity={hasLiquidity} bidPercent={bidPercent} askPercent={askPercent} />
    </div>
  );
}
