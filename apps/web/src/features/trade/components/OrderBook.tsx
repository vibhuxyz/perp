import { useState, useMemo } from 'react';
import { useMarketStore, type Level } from '@/stores/market.store';
import { formatPrice } from '@/shared/lib/formatters';
import { Minus, Plus, Lock } from 'lucide-react';

const DEFAULT_ASKS: { price: string; quantity: string; total: string }[] = [
  { price: '77,257.6', quantity: '0.02229', total: '4.67453' },
  { price: '77,257.5', quantity: '1.30702', total: '4.65224' },
  { price: '77,257.4', quantity: '0.00171', total: '3.34522' },
  { price: '77,256.4', quantity: '0.22098', total: '3.34351' },
  { price: '77,256.3', quantity: '0.00285', total: '3.12253' },
  { price: '77,255.8', quantity: '0.00084', total: '3.11968' },
  { price: '77,255.2', quantity: '0.04011', total: '3.11884' },
  { price: '77,253.6', quantity: '0.12939', total: '3.07873' },
  { price: '77,253.5', quantity: '0.64722', total: '2.94934' },
  { price: '77,253.4', quantity: '2.30212', total: '2.30212' },
];

const DEFAULT_BIDS: { price: string; quantity: string; total: string }[] = [
  { price: '77,253.3', quantity: '2.18087', total: '2.18087' },
  { price: '77,253.2', quantity: '0.71192', total: '2.89279' },
  { price: '77,253.0', quantity: '0.00970', total: '2.90249' },
  { price: '77,252.9', quantity: '0.00970', total: '2.91219' },
  { price: '77,252.8', quantity: '0.00970', total: '2.92189' },
  { price: '77,252.7', quantity: '0.00970', total: '2.93159' },
  { price: '77,252.6', quantity: '0.00003', total: '2.93162' },
  { price: '77,252.3', quantity: '0.05373', total: '2.98535' },
  { price: '77,252.1', quantity: '0.00560', total: '2.99095' },
  { price: '77,251.8', quantity: '0.01294', total: '3.00389' },
];

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

  const precision = PRECISION_STEPS[precisionIndex] ?? '0.1';

  const handleStepDown = () => {
    setPrecisionIndex(prev => Math.max(0, prev - 1));
  };

  const handleStepUp = () => {
    setPrecisionIndex(prev => Math.min(PRECISION_STEPS.length - 1, prev + 1));
  };

  // If real engine store has book data, map it; otherwise use the exact reference numbers
  const asksData = useMemo(() => {
    if (storeAsks.length > 0) {
      let running = 0;
      const totals: number[] = [];
      const slice = storeAsks.slice(0, viewMode === 'asks' ? 20 : 10);
      for (const a of slice) {
        running += parseFloat(a.quantity) || 0;
        totals.push(running);
      }
      const maxTot = running || 1;
      return slice.map((a: Level, i: number) => {
        const tot = totals[i] ?? 0;
        return {
          price: formatPrice(a.price),
          size: (parseFloat(a.quantity) || 0).toFixed(5),
          total: tot.toFixed(5),
          depthPercent: Math.min(100, Math.round((tot / maxTot) * 100)),
        };
      });
    }

    const maxTot = 4.67453;
    const list = viewMode === 'asks' ? [...DEFAULT_ASKS, ...DEFAULT_ASKS] : DEFAULT_ASKS;
    return list.map(item => ({
      price: item.price,
      size: item.quantity,
      total: item.total,
      depthPercent: Math.min(100, Math.round((parseFloat(item.total) / maxTot) * 100)),
    }));
  }, [storeAsks, viewMode]);

  const bidsData = useMemo(() => {
    if (storeBids.length > 0) {
      let running = 0;
      const totals: number[] = [];
      const slice = storeBids.slice(0, viewMode === 'bids' ? 20 : 10);
      for (const b of slice) {
        running += parseFloat(b.quantity) || 0;
        totals.push(running);
      }
      const maxTot = running || 1;
      return slice.map((b: Level, i: number) => {
        const tot = totals[i] ?? 0;
        return {
          price: formatPrice(b.price),
          size: (parseFloat(b.quantity) || 0).toFixed(5),
          total: tot.toFixed(5),
          depthPercent: Math.min(100, Math.round((tot / maxTot) * 100)),
        };
      });
    }

    const maxTot = 3.00389;
    const list = viewMode === 'bids' ? [...DEFAULT_BIDS, ...DEFAULT_BIDS] : DEFAULT_BIDS;
    return list.map(item => ({
      price: item.price,
      size: item.quantity,
      total: item.total,
      depthPercent: Math.min(100, Math.round((parseFloat(item.total) / maxTot) * 100)),
    }));
  }, [storeBids, viewMode]);

  const midPrice = lastTradePrice ? formatPrice(lastTradePrice) : '77,255.9';
  const markPriceDisplay = indexPrice ? formatPrice(indexPrice) : '77,253.4';

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
          Trades
        </button>
      </div>

      {activeTab === 'book' ? (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* 2. Control Toolbar: View Modes (Left) & Precision Stepper (Right) */}
          <div className="flex h-9 shrink-0 items-center justify-between px-3 bg-[#0C1018] border-b border-[#1A2333]/70">
            {/* View Mode Buttons */}
            <div className="flex items-center gap-2">
              {/* Both asks and bids view */}
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

              {/* Bids only view */}
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

              {/* Asks only view */}
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

              {/* Lock button */}
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
              {asksData.map((ask, i) => (
                <div
                  key={`ask-${ask.price}-${i}`}
                  className="relative grid grid-cols-3 px-3 py-[2.5px] text-xs font-mono tabular-nums hover:bg-[#151D2C] cursor-pointer group"
                >
                  {/* Red depth bar extending from right edge */}
                  <div
                    className="absolute top-0 bottom-0 right-0 bg-[#FF4D5A]/20 pointer-events-none transition-all"
                    style={{ width: `${ask.depthPercent}%` }}
                  />
                  <span className="text-left text-[#FF4D5A] font-medium z-10">{ask.price}</span>
                  <span className="text-right text-white/90 z-10">{ask.size}</span>
                  <span className="text-right text-white/90 z-10">{ask.total}</span>
                </div>
              ))}
            </div>
          )}

          {/* 5. Center Mid-Price & Mark Price Banner */}
          <div className="flex h-10 shrink-0 items-center justify-between px-3 border-y border-[#1A2333] bg-[#0E121B] font-mono">
            <span className="text-base font-extrabold text-[#00F29D] tabular-nums tracking-tight">
              {midPrice}
            </span>
            <span className="text-xs text-[#8492A6] tabular-nums font-medium">
              {markPriceDisplay}
            </span>
          </div>

          {/* 6. Bids (Green) Section */}
          {(viewMode === 'all' || viewMode === 'bids') && (
            <div className="flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-none py-0.5">
              {bidsData.map((bid, i) => (
                <div
                  key={`bid-${bid.price}-${i}`}
                  className="relative grid grid-cols-3 px-3 py-[2.5px] text-xs font-mono tabular-nums hover:bg-[#151D2C] cursor-pointer group"
                >
                  {/* Green depth bar extending from right edge */}
                  <div
                    className="absolute top-0 bottom-0 right-0 bg-[#00F29D]/20 pointer-events-none transition-all"
                    style={{ width: `${bid.depthPercent}%` }}
                  />
                  <span className="text-left text-[#00F29D] font-medium z-10">{bid.price}</span>
                  <span className="text-right text-white/90 z-10">{bid.size}</span>
                  <span className="text-right text-white/90 z-10">{bid.total}</span>
                </div>
              ))}
            </div>
          )}

          {/* 7. Bottom Depth Ratio Bar with Diagonal Separator */}
          <div className="p-2 shrink-0 border-t border-[#1A2333] bg-[#0C1018]">
            <div className="flex h-6 w-full rounded-md overflow-hidden bg-[#0A0D14] text-xs font-bold font-mono">
              {/* Green 36% Block */}
              <div
                style={{
                  width: '36%',
                  clipPath: 'polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
                }}
                className="bg-[#00F29D]/20 text-[#00F29D] flex items-center px-2.5"
              >
                36%
              </div>

              {/* Red 64% Block with matching diagonal angle */}
              <div
                style={{
                  width: '66%',
                  marginLeft: '-8px',
                  clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%)',
                }}
                className="bg-[#FF4D5A]/20 text-[#FF4D5A] flex items-center justify-end px-2.5"
              >
                64%
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Recent Trades view */
        <div className="flex flex-col flex-1 p-3 text-xs text-[#8492A6] font-mono">
          <div className="grid grid-cols-3 pb-2 text-[11px] font-medium border-b border-[#1A2333]/50">
            <span>Price (USD)</span>
            <span className="text-right">Size (BTC)</span>
            <span className="text-right">Time</span>
          </div>
          <div className="flex flex-col gap-1 pt-2 overflow-y-auto scrollbar-thin">
            {[
              { price: '77,255.9', size: '0.12400', time: '12:45:22', isUp: true },
              { price: '77,255.2', size: '0.04500', time: '12:45:21', isUp: false },
              { price: '77,255.9', size: '0.85000', time: '12:45:18', isUp: true },
              { price: '77,253.4', size: '0.32000', time: '12:45:15', isUp: false },
              { price: '77,255.9', size: '0.50000', time: '12:45:11', isUp: true },
            ].map((t, idx) => (
              <div key={idx} className="grid grid-cols-3 py-1">
                <span className={t.isUp ? 'text-[#00F29D]' : 'text-[#FF4D5A]'}>{t.price}</span>
                <span className="text-right text-white">{t.size}</span>
                <span className="text-right text-[#8492A6] text-[11px]">{t.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
