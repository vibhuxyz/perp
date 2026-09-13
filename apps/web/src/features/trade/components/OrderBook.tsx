import { useState, useMemo } from 'react';
import { useMarketStore } from '@/stores/market.store';
import { formatPrice, formatSize } from '@/shared/lib/formatters';
import { Minus, Plus, Lock } from 'lucide-react';
import Decimal from 'decimal.js';

const PRECISION_STEPS = ['0.01', '0.1', '1', '5', '10'];

type ViewMode = 'all' | 'asks' | 'bids';

export function OrderBook() {
  const [activeTab, setActiveTab] = useState<'book' | 'trades'>('book');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [precisionIndex, setPrecisionIndex] = useState(1); // '0.1'

  const storeBids = useMarketStore(s => s.bids);
  const storeAsks = useMarketStore(s => s.asks);
  const lastTradePrice = useMarketStore(s => s.lastTradePrice);
  const indexPrice = useMarketStore(s => s.indexPrice);
  const realTrades = useMarketStore(s => s.trades);

  const precision = PRECISION_STEPS[precisionIndex] ?? '0.1';

  const handleStepDown = () => {
    setPrecisionIndex(prev => Math.max(0, prev - 1));
  };

  const handleStepUp = () => {
    setPrecisionIndex(prev => Math.min(PRECISION_STEPS.length - 1, prev + 1));
  };

  // Real depth data calculation from actual engine levels
  const asksData = useMemo(() => {
    if (storeAsks.length === 0) return [];

    let running = new Decimal(0);
    const totals: Decimal[] = [];
    const slice = storeAsks.slice(0, viewMode === 'asks' ? 20 : 10);

    for (const a of slice) {
      running = running.plus(a.quantity);
      totals.push(running);
    }

    const maxTot = running.gt(0) ? running : new Decimal(1);

    return slice.map((a, i) => {
      const tot = totals[i] ?? new Decimal(0);
      return {
        price: formatPrice(a.price),
        size: formatSize(a.quantity),
        total: formatSize(tot.toString()),
        depthPercent: Math.min(100, Math.round(tot.div(maxTot).times(100).toNumber())),
      };
    });
  }, [storeAsks, viewMode]);

  const bidsData = useMemo(() => {
    if (storeBids.length === 0) return [];

    let running = new Decimal(0);
    const totals: Decimal[] = [];
    const slice = storeBids.slice(0, viewMode === 'bids' ? 20 : 10);

    for (const b of slice) {
      running = running.plus(b.quantity);
      totals.push(running);
    }

    const maxTot = running.gt(0) ? running : new Decimal(1);

    return slice.map((b, i) => {
      const tot = totals[i] ?? new Decimal(0);
      return {
        price: formatPrice(b.price),
        size: formatSize(b.quantity),
        total: formatSize(tot.toString()),
        depthPercent: Math.min(100, Math.round(tot.div(maxTot).times(100).toNumber())),
      };
    });
  }, [storeBids, viewMode]);

  // Real depth balance ratio calculation
  const { bidPercent, askPercent } = useMemo(() => {
    const totalBids = storeBids.reduce((sum, b) => sum.plus(b.quantity), new Decimal(0));
    const totalAsks = storeAsks.reduce((sum, a) => sum.plus(a.quantity), new Decimal(0));
    const totalLiquidity = totalBids.plus(totalAsks);

    if (totalLiquidity.isZero()) {
      return { bidPercent: 50, askPercent: 50 };
    }

    const bPct = Math.round(totalBids.div(totalLiquidity).times(100).toNumber());
    const aPct = 100 - bPct;
    return { bidPercent: bPct, askPercent: aPct };
  }, [storeBids, storeAsks]);

  const midPrice = lastTradePrice
    ? formatPrice(lastTradePrice)
    : indexPrice
    ? formatPrice(indexPrice)
    : '—';

  const markPriceDisplay = indexPrice ? formatPrice(indexPrice) : '—';

  return (
    <div className="flex flex-col h-full bg-[#0E121B] rounded-xl border border-[#1A2333] overflow-hidden select-none">
      {/* 1. Top Tabs: Book | Trades */}
      <div className="flex h-11 shrink-0 items-center px-3 gap-2 bg-[#0E121B] border-b border-[#1A2333]">
        <button
          type="button"
          onClick={() => setActiveTab('book')}
          className={[
            'rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs',
            activeTab === 'book'
              ? 'bg-[#181F2E] text-white border border-[#26344B]'
              : 'text-[#8492A6] hover:text-white',
          ].join(' ')}
        >
          Book
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('trades')}
          className={[
            'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer',
            activeTab === 'trades'
              ? 'bg-[#181F2E] text-white border border-[#26344B]'
              : 'text-[#8492A6] hover:text-white',
          ].join(' ')}
        >
          Trades ({realTrades.length})
        </button>
      </div>

      {activeTab === 'book' ? (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* 2. Control Toolbar: View Modes (Left) & Precision Stepper (Right) */}
          <div className="flex h-9 shrink-0 items-center justify-between px-3 bg-[#0C1018] border-b border-[#1A2333]/70">
            {/* View Mode Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`p-1 rounded transition-colors ${viewMode === 'all' ? 'bg-[#161E2E] text-[#00F29D]' : 'text-[#8492A6] hover:text-white'}`}
                title="Default (Asks & Bids)"
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <rect y="1" width="16" height="2" rx="1" fill="#FF4D5A" />
                  <rect y="5" width="16" height="2" rx="1" fill="#FF4D5A" />
                  <rect y="9" width="16" height="2" rx="1" fill="#00F29D" />
                  <rect y="13" width="16" height="2" rx="1" fill="#00F29D" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('bids')}
                className={`p-1 rounded transition-colors ${viewMode === 'bids' ? 'bg-[#161E2E] text-[#00F29D]' : 'text-[#8492A6] hover:text-white'}`}
                title="Bids Only"
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <rect y="1" width="16" height="2" rx="1" fill="#00F29D" />
                  <rect y="5" width="16" height="2" rx="1" fill="#00F29D" />
                  <rect y="9" width="16" height="2" rx="1" fill="#00F29D" />
                  <rect y="13" width="16" height="2" rx="1" fill="#00F29D" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('asks')}
                className={`p-1 rounded transition-colors ${viewMode === 'asks' ? 'bg-[#161E2E] text-[#FF4D5A]' : 'text-[#8492A6] hover:text-white'}`}
                title="Asks Only"
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <rect y="1" width="16" height="2" rx="1" fill="#FF4D5A" />
                  <rect y="5" width="16" height="2" rx="1" fill="#FF4D5A" />
                  <rect y="9" width="16" height="2" rx="1" fill="#FF4D5A" />
                  <rect y="13" width="16" height="2" rx="1" fill="#FF4D5A" />
                </svg>
              </button>

              <button
                type="button"
                className="p-1 rounded text-[#8492A6] hover:text-white transition-colors"
                title="Lock view"
              >
                <Lock className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Precision Stepper: Minus, 0.1, Plus */}
            <div className="flex items-center gap-2 rounded-lg border border-[#1E283C] bg-[#121824] px-2 py-0.5 text-xs text-white font-mono">
              <button
                type="button"
                onClick={handleStepDown}
                className="text-[#8492A6] hover:text-white transition-colors cursor-pointer"
                title="Decrease tick size"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="font-bold tabular-nums min-w-6 text-center">{precision}</span>
              <button
                type="button"
                onClick={handleStepUp}
                className="text-[#8492A6] hover:text-white transition-colors cursor-pointer"
                title="Increase tick size"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* 3. Table Headers Row */}
          <div className="grid grid-cols-3 h-7 shrink-0 items-center px-3 text-[11px] text-[#8492A6] font-medium border-b border-[#1A2333]/60 bg-[#0C1018]">
            <span className="text-left font-sans">Price (USD)</span>
            <span className="text-right font-sans">Size (BTC)</span>
            <span className="text-right font-sans">Total (BTC)</span>
          </div>

          {/* 4. Asks (Red) Section */}
          {(viewMode === 'all' || viewMode === 'asks') && (
            <div className="flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-none py-0.5">
              {asksData.length > 0 ? (
                asksData.map((ask, i) => (
                  <div
                    key={`ask-${ask.price}-${i}`}
                    className="relative grid grid-cols-3 px-3 py-[2.5px] text-xs font-mono tabular-nums hover:bg-[#151D2C] cursor-pointer group"
                  >
                    <div
                      className="absolute top-0 bottom-0 right-0 bg-[#FF4D5A]/20 pointer-events-none transition-all"
                      style={{ width: `${ask.depthPercent}%` }}
                    />
                    <span className="text-left text-[#FF4D5A] font-medium z-10">${ask.price}</span>
                    <span className="text-right text-white/90 z-10">{ask.size}</span>
                    <span className="text-right text-white/90 z-10">{ask.total}</span>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center p-3 text-center text-[11px] text-[#8492A6]">
                  No resting asks in book
                </div>
              )}
            </div>
          )}

          {/* 5. Center Mid-Price & Mark Price Banner */}
          <div className="flex h-10 shrink-0 items-center justify-between px-3 border-y border-[#1A2333] bg-[#0E121B] font-mono">
            <span className="text-base font-extrabold text-[#00F29D] tabular-nums tracking-tight">
              {midPrice !== '—' ? `$${midPrice}` : '—'}
            </span>
            <span className="text-xs text-[#8492A6] tabular-nums font-medium">
              {markPriceDisplay !== '—' ? `Mark: $${markPriceDisplay}` : '—'}
            </span>
          </div>

          {/* 6. Bids (Green) Section */}
          {(viewMode === 'all' || viewMode === 'bids') && (
            <div className="flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-none py-0.5">
              {bidsData.length > 0 ? (
                bidsData.map((bid, i) => (
                  <div
                    key={`bid-${bid.price}-${i}`}
                    className="relative grid grid-cols-3 px-3 py-[2.5px] text-xs font-mono tabular-nums hover:bg-[#151D2C] cursor-pointer group"
                  >
                    <div
                      className="absolute top-0 bottom-0 right-0 bg-[#00F29D]/20 pointer-events-none transition-all"
                      style={{ width: `${bid.depthPercent}%` }}
                    />
                    <span className="text-left text-[#00F29D] font-medium z-10">${bid.price}</span>
                    <span className="text-right text-white/90 z-10">{bid.size}</span>
                    <span className="text-right text-white/90 z-10">{bid.total}</span>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center p-3 text-center text-[11px] text-[#8492A6]">
                  No resting bids in book
                </div>
              )}
            </div>
          )}

          {/* 7. Bottom Depth Ratio Bar with Real Liquidity Ratio */}
          <div className="p-2 shrink-0 border-t border-[#1A2333] bg-[#0C1018]">
            <div className="flex h-6 w-full rounded-md overflow-hidden bg-[#0A0D14] text-xs font-bold font-mono">
              <div
                style={{
                  width: `${bidPercent}%`,
                  clipPath: 'polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
                }}
                className="bg-[#00F29D]/20 text-[#00F29D] flex items-center px-2.5 transition-all"
              >
                {bidPercent}%
              </div>

              <div
                style={{
                  width: `${askPercent + 2}%`,
                  marginLeft: '-8px',
                  clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%)',
                }}
                className="bg-[#FF4D5A]/20 text-[#FF4D5A] flex items-center justify-end px-2.5 transition-all"
              >
                {askPercent}%
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Real Recent Trades View from WebSocket Fills */
        <div className="flex flex-col flex-1 p-3 text-xs text-[#8492A6] font-mono">
          <div className="grid grid-cols-3 pb-2 text-[11px] font-medium border-b border-[#1A2333]/50">
            <span>Price (USD)</span>
            <span className="text-right">Size (BTC)</span>
            <span className="text-right">Time</span>
          </div>
          <div className="flex flex-col gap-1 pt-2 overflow-y-auto scrollbar-thin">
            {realTrades.length > 0 ? (
              realTrades.map((t, idx) => (
                <div key={`${t.id}-${idx}`} className="grid grid-cols-3 py-1">
                  <span className={t.isUp ? 'text-[#00F29D]' : 'text-[#FF4D5A]'}>
                    ${formatPrice(t.price)}
                  </span>
                  <span className="text-right text-white">{formatSize(t.size)}</span>
                  <span className="text-right text-[#8492A6] text-[11px]">{t.time}</span>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-[11px] text-[#8492A6]">
                No trades recorded yet this session.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
