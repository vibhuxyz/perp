import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrderForm } from '../hooks/useOrderForm';
import { useAccountStore } from '@/stores/account.store';
import { useMarketStore, selectBestBid, selectBestAsk } from '@/stores/market.store';
import { fetchEquity } from '../api/tradeApi';
import { AuthModal } from '@/features/auth/AuthModal';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import Decimal from 'decimal.js';

const LEVERAGE_STOPS = [1, 5, 10, 25, 50, 100] as const;

const oneDecimalFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function OrderTicket({ indexPrice }: { indexPrice: string | null }) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [orderTypeTab, setOrderTypeTab] = useState<'LIMIT' | 'MARKET' | 'STOP'>('LIMIT');
  const [percent, setPercent] = useState<number>(0);
  const [leverageStopIndex, setLeverageStopIndex] = useState<number>(2); // 10x default

  const token = useAccountStore(s => s.token);
  const isAuthenticated = Boolean(token);

  const lastTradePrice = useMarketStore(s => s.lastTradePrice);
  const bestBid = useMarketStore(selectBestBid);
  const bestAsk = useMarketStore(selectBestAsk);

  const { data: equity } = useQuery({
    queryKey: ['equity', token],
    queryFn: fetchEquity,
    enabled: isAuthenticated,
    retry: false,
  });

  const { form, mutation, values, margin, liquidation, submitOrder } = useOrderForm(indexPrice);

  // Sync initial price if indexPrice arrives and price isn't set yet
  useEffect(() => {
    if (indexPrice && (!values.price || values.price === '67432.1' || values.price === '50000')) {
      form.setValue('price', indexPrice);
    }
  }, [indexPrice, form, values.price]);

  const isLong = values.side === 'LONG';
  const effectivePrice = values.type === 'MARKET'
    ? (indexPrice ?? '77255.9')
    : (values.price?.replace(/,/g, '') || indexPrice || '77255.9');

  const currentLeverage = LEVERAGE_STOPS[leverageStopIndex] ?? 10;
  const displayQuantity = values.quantity || '0';

  // Calculate Order Value (USDT)
  const orderValueUSDT = useMemo(() => {
    try {
      const q = new Decimal(displayQuantity);
      const p = new Decimal(effectivePrice);
      if (q.isZero() || p.isZero()) return '0';
      return q.times(p).toFixed(2);
    } catch {
      return '0';
    }
  }, [displayQuantity, effectivePrice]);

  const requiredMargin = useMemo(() => {
    if (margin && !margin.isZero()) return margin.toFixed(2);
    try {
      const val = new Decimal(orderValueUSDT);
      if (val.isZero()) return '0.00';
      return val.div(currentLeverage).toFixed(2);
    } catch {
      return '0.00';
    }
  }, [margin, orderValueUSDT, currentLeverage]);

  const estLiqPrice = useMemo(() => {
    if (liquidation) return oneDecimalFormatter.format(liquidation.toNumber());
    try {
      const p = new Decimal(effectivePrice);
      const diff = p.div(currentLeverage);
      const liq = isLong ? p.minus(diff) : p.plus(diff);
      return oneDecimalFormatter.format(liq.toNumber());
    } catch {
      return '—';
    }
  }, [liquidation, effectivePrice, currentLeverage, isLong]);

  const estFee = useMemo(() => {
    try {
      const val = new Decimal(orderValueUSDT);
      if (val.isZero()) return '0.0000';
      return val.times(0.0001).toFixed(4);
    } catch {
      return '0.0000';
    }
  }, [orderValueUSDT]);

  const handlePercentChange = (pct: number) => {
    setPercent(pct);
    const available = equity?.availableBalance ? parseFloat(equity.availableBalance) : 10000;
    const priceNum = parseFloat(effectivePrice) || 77255.9;
    if (priceNum <= 0) return;

    if (pct === 0) {
      form.setValue('quantity', '0');
      return;
    }

    const maxBtc = (available * currentLeverage) / priceNum;
    const calculated = (maxBtc * (pct / 100)).toFixed(2);
    form.setValue('quantity', parseFloat(calculated) > 0 ? calculated : '0');
  };

  const handleOrderValueInput = (val: string) => {
    const cleanVal = val.replace(/,/g, '');
    const priceNum = parseFloat(effectivePrice) || 77255.9;
    if (priceNum <= 0) return;

    const numVal = parseFloat(cleanVal);
    if (isNaN(numVal) || numVal <= 0) {
      form.setValue('quantity', '0');
    } else {
      const calculatedQty = (numVal / priceNum).toFixed(4);
      form.setValue('quantity', calculatedQty);
    }
  };

  const handleMidClick = () => {
    const mid = lastTradePrice ?? indexPrice ?? '77255.9';
    form.setValue('price', mid);
  };

  const handleBboClick = () => {
    const bbo = isLong ? (bestAsk ?? lastTradePrice ?? indexPrice ?? '77255.9') : (bestBid ?? lastTradePrice ?? indexPrice ?? '77255.9');
    form.setValue('price', bbo);
  };

  const handleLeverageChange = (stopIdx: number) => {
    const clamped = Math.max(0, Math.min(LEVERAGE_STOPS.length - 1, stopIdx));
    setLeverageStopIndex(clamped);
    const lev = LEVERAGE_STOPS[clamped] ?? 10;
    form.setValue('leverage', String(lev));
  };

  const handleResetLeverage = () => {
    handleLeverageChange(2); // reset to 10x
  };

  const leveragePercentagePos = (leverageStopIndex / (LEVERAGE_STOPS.length - 1)) * 100;

  return (
    <>
      <div className="flex flex-col h-full bg-[#0A0E17] rounded-xl border border-[#162032] p-3.5 gap-3.5 select-none overflow-y-auto scrollbar-thin">
        {/* 1. Long / Short Segmented Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => form.setValue('side', 'LONG')}
            className={[
              'py-2 rounded-lg text-sm font-bold transition-all cursor-pointer shadow-xs',
              isLong
                ? 'bg-[#00DA8E] text-white shadow-md shadow-[#00DA8E]/25'
                : 'bg-[#111724] border border-[#1C2638] text-[#8492A6] hover:text-white',
            ].join(' ')}
          >
            Long
          </button>
          <button
            type="button"
            onClick={() => form.setValue('side', 'SHORT')}
            className={[
              'py-2 rounded-lg text-sm font-bold transition-all cursor-pointer shadow-xs',
              !isLong
                ? 'bg-[#FF4D5A] text-white shadow-md shadow-[#FF4D5A]/25'
                : 'bg-[#111724] border border-[#1C2638] text-[#8492A6] hover:text-white',
            ].join(' ')}
          >
            Short
          </button>
        </div>

        {/* 2. Order Type Tabs: Limit | Market | Stop */}
        <div className="flex items-center bg-[#0D131F] border border-[#182234] rounded-lg p-0.5">
          {(['LIMIT', 'MARKET', 'STOP'] as const).map(type => {
            const isSelected = orderTypeTab === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setOrderTypeTab(type);
                  if (type === 'LIMIT' || type === 'MARKET') {
                    form.setValue('type', type);
                  }
                }}
                className={[
                  'flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer text-center',
                  isSelected
                    ? 'bg-[#1A2539] text-white font-bold shadow-xs border-b-2 border-[#3B82F6]'
                    : 'text-[#8492A6] hover:text-white',
                ].join(' ')}
              >
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>

        {/* 3. Price Input with Mid | BBO Links and Green $ Icon Badge */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#8492A6]">Price</span>
            <div className="flex items-center gap-1.5 font-medium text-xs">
              <button
                type="button"
                onClick={handleMidClick}
                className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors cursor-pointer"
              >
                Mid
              </button>
              <span className="text-[#2B384E]">|</span>
              <button
                type="button"
                onClick={handleBboClick}
                className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors cursor-pointer"
              >
                BBO
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-[#141924] border border-[#1E2638]/70 px-3.5 py-2.5 focus-within:border-[#3B82F6] transition-colors">
            <input
              id="order-price"
              {...form.register('price')}
              disabled={orderTypeTab === 'MARKET'}
              placeholder={orderTypeTab === 'MARKET' ? 'Market price' : (indexPrice ?? '77,255.9')}
              className="w-full bg-transparent text-base font-semibold text-white font-mono tabular-nums placeholder:text-[#556377] focus:outline-none disabled:opacity-50"
            />
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white font-bold text-xs shadow-xs ml-2 select-none">
              $
            </div>
          </div>
        </div>

        {/* 4. Quantity Input with Orange ₿ Icon Badge */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[#8492A6]">Quantity</span>
          <div className="flex items-center justify-between rounded-xl bg-[#141924] border border-[#1E2638]/70 px-3.5 py-2.5 focus-within:border-[#3B82F6] transition-colors">
            <input
              id="order-size"
              {...form.register('quantity')}
              placeholder="0"
              className="w-full bg-transparent text-base font-semibold text-white font-mono tabular-nums placeholder:text-[#556377] focus:outline-none"
            />
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F7931A] text-white font-bold text-xs shadow-xs ml-2 select-none">
              ₿
            </div>
          </div>
        </div>

        {/* 5. Percentage Slider with Ring Ticks and 0 to 100% Labels */}
        <div className="flex flex-col gap-1 py-1">
          <div className="relative flex items-center py-2 cursor-pointer">
            {/* Background track line */}
            <div className="w-full h-[3px] bg-[#222B3D] rounded-full relative">
              {/* Blue progress fill */}
              <div
                className="h-full bg-[#3B82F6] rounded-full"
                style={{ width: `${percent}%` }}
              />

              {/* 5 Tick Circles */}
              {[0, 25, 50, 75, 100].map(tick => {
                const isPassed = percent >= tick;
                return (
                  <div
                    key={`tick-${tick}`}
                    style={{ left: `${tick}%` }}
                    className={[
                      'absolute w-2.5 h-2.5 rounded-full -top-[3.5px] -translate-x-1/2 pointer-events-none transition-colors',
                      isPassed
                        ? 'border-2 border-[#3B82F6] bg-[#0A0E17]'
                        : 'border-2 border-[#2E3B52] bg-[#0A0E17]',
                    ].join(' ')}
                  />
                );
              })}

              {/* Knob */}
              <div
                style={{ left: `${percent}%` }}
                className="absolute w-4 h-4 rounded-full bg-[#3B82F6] shadow-sm shadow-[#3B82F6]/60 top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
              />
            </div>

            {/* Native Range Input for drag interaction */}
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={percent}
              onChange={e => handlePercentChange(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Labels: 0 on left, 100% on right */}
          <div className="flex justify-between text-xs font-mono text-[#8492A6] px-0.5">
            <span>0</span>
            <span>100%</span>
          </div>
        </div>

        {/* 6. Order Value Input with Green $ Icon Badge */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[#8492A6]">Order Value</span>
          <div className="flex items-center justify-between rounded-xl bg-[#141924] border border-[#1E2638]/70 px-3.5 py-2.5 focus-within:border-[#3B82F6] transition-colors">
            <input
              id="order-value"
              value={orderValueUSDT === '0' ? '0' : orderValueUSDT}
              onChange={e => handleOrderValueInput(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent text-base font-semibold text-white font-mono tabular-nums placeholder:text-[#556377] focus:outline-none"
            />
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white font-bold text-xs shadow-xs ml-2 select-none">
              $
            </div>
          </div>
        </div>

        {/* 7. Leverage Slider Section */}
        <div className="flex flex-col gap-1 pt-0.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#8492A6]">Leverage</span>
            <button
              type="button"
              onClick={handleResetLeverage}
              className="flex items-center gap-1 font-mono font-bold text-white hover:text-[#00D2FF] transition-colors cursor-pointer"
              title="Reset leverage to 10x"
            >
              <span>{currentLeverage}x</span>
              <RotateCcw className="h-3 w-3 text-[#8492A6]" />
            </button>
          </div>

          <div className="relative flex items-center py-1.5 cursor-pointer">
            {/* Background Line */}
            <div className="w-full h-[3px] bg-[#222B3D] rounded-full relative">
              {/* Fill Line */}
              <div
                className="h-full bg-[#3B82F6] rounded-full"
                style={{ width: `${leveragePercentagePos}%` }}
              />

              {/* Tick Dots */}
              {LEVERAGE_STOPS.map((stop, i) => {
                const pos = (i / (LEVERAGE_STOPS.length - 1)) * 100;
                return (
                  <div
                    key={`lev-dot-${stop}`}
                    style={{ left: `${pos}%` }}
                    className="absolute w-2 h-2 rounded-full border border-[#2E3B52] bg-[#0A0E17] -top-[2.5px] -translate-x-1/2 pointer-events-none"
                  />
                );
              })}

              {/* Slider Knob */}
              <div
                style={{ left: `${leveragePercentagePos}%` }}
                className="absolute w-3.5 h-3.5 rounded-full bg-[#3B82F6] shadow-sm shadow-[#3B82F6]/60 top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
              />
            </div>

            {/* Hidden Input for dragging */}
            <input
              type="range"
              min="0"
              max={LEVERAGE_STOPS.length - 1}
              step="1"
              value={leverageStopIndex}
              onChange={e => handleLeverageChange(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Tick Labels */}
          <div className="flex justify-between text-[10px] font-mono text-[#6A7B95] px-0.5">
            {LEVERAGE_STOPS.map((stop, i) => (
              <button
                key={stop}
                type="button"
                onClick={() => handleLeverageChange(i)}
                className={[
                  'cursor-pointer transition-colors hover:text-white',
                  leverageStopIndex === i ? 'text-white font-bold' : '',
                ].join(' ')}
              >
                {stop}x
              </button>
            ))}
          </div>
        </div>

        {/* 8. Summary Breakdown: Flat List matching Screenshot */}
        <div className="flex flex-col gap-2 pt-1 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[#8492A6] font-sans">Required Margin</span>
            <span className="text-white font-medium tabular-nums">{requiredMargin} USDT</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#8492A6] font-sans">Est. Liquidation Price</span>
            <span className="text-white font-medium tabular-nums">{estLiqPrice}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#8492A6] font-sans">Est. Fee</span>
            <span className="text-white font-medium tabular-nums">{estFee} USDT</span>
          </div>
        </div>

        {/* Server Rejection Alert */}
        {mutation.error && (
          <div className="flex items-start gap-2 rounded-lg border border-[#FF4D5A]/30 bg-[#FF4D5A]/10 p-2.5 text-xs text-[#FF4D5A]">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Order rejected: {mutation.error.message}</span>
          </div>
        )}

        {/* Server Success Alert */}
        {mutation.data && (
          <div className="rounded-lg border border-[#00DA8E]/30 bg-[#00DA8E]/10 p-2.5 text-xs text-[#00DA8E]">
            Order {mutation.data.status} · Filled {mutation.data.filledQuantity} BTC
          </div>
        )}

        {/* 9. Big Action Button at Bottom */}
        <div className="mt-auto pt-2">
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => {
              if (!isAuthenticated) {
                setIsAuthOpen(true);
              } else {
                submitOrder();
              }
            }}
            className={[
              'w-full rounded-xl py-2.5 px-4 flex flex-col items-center justify-center transition-all cursor-pointer font-sans shadow-lg',
              !isAuthenticated
                ? 'bg-[#7152FF] hover:bg-[#6042EE] text-white shadow-[#7152FF]/25'
                : isLong
                ? 'bg-[#00DA8E] hover:bg-[#00C57F] text-black shadow-md shadow-[#00DA8E]/20'
                : 'bg-[#FF4D5A] hover:bg-[#EE404D] text-white shadow-md shadow-[#FF4D5A]/20',
              mutation.isPending ? 'opacity-70 pointer-events-none' : '',
            ].join(' ')}
          >
            <span className="text-sm font-bold leading-tight">
              {mutation.isPending
                ? 'Submitting…'
                : !isAuthenticated
                ? 'Log in to trade'
                : isLong
                ? 'Open Long (Demo)'
                : 'Open Short (Demo)'}
            </span>
            {isAuthenticated && (
              <span className="text-xs font-medium opacity-80 font-mono leading-tight mt-0.5">
                ≈ {displayQuantity} BTC
              </span>
            )}
          </button>
        </div>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
