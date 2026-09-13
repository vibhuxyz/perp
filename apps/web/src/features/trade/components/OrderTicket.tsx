import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { useOrderForm } from '../hooks/useOrderForm';
import { useAccountStore } from '@/stores/account.store';
import { AuthModal } from '@/features/auth/AuthModal';
import { GraduationCap, ChevronRight, RotateCcw } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const PERCENT_PRESETS = [0, 25, 50, 75, 100];
const LEVERAGE_TICKS = [1, 5, 10, 25, 50, 100];

export function OrderTicket({ indexPrice }: { indexPrice: string | null }) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [orderTypeTab, setOrderTypeTab] = useState<'LIMIT' | 'MARKET' | 'STOP'>('LIMIT');

  const token = useAccountStore(s => s.token);
  const isAuthenticated = Boolean(token);

  const { form, mutation, values, margin, liquidation, submitOrder } = useOrderForm(indexPrice);

  const isLong = values.side === 'LONG';
  const displayPrice = values.price || '67432.1';
  const displaySize = values.quantity || '0.01';

  // Approximate USDT notional
  const notionalUSDT = (parseFloat(displaySize) * parseFloat(displayPrice) || 674.32).toFixed(2);
  const requiredMargin = margin ? margin.toFixed(2) : '67.43';
  const estLiqPrice = liquidation ? liquidation.toFixed(1) : '60,688.9';
  const estFee = ((parseFloat(notionalUSDT) * 0.0001) || 0.0674).toFixed(4);

  const currentLeverage = Number(values.leverage) || 10;

  const handlePercentClick = (pct: number) => {
    // Assuming 100000 balance at 10x leverage
    const maxContracts = (100000 * currentLeverage) / parseFloat(displayPrice);
    const calculated = ((maxContracts * pct) / 100).toFixed(2);
    form.setValue('quantity', pct === 0 ? '0.01' : calculated);
  };

  return (
    <>
      <div className="flex flex-col h-full bg-[#0E121B] rounded-xl border border-[#1A2333] overflow-y-auto scrollbar-thin p-3.5 gap-3.5 select-none">
        {/* Top Educational Card */}
        <NavLink
          to="/learn"
          className="flex items-center justify-between gap-3 rounded-xl border border-[#1A2E4B] bg-[#121B2B] hover:bg-[#152338] p-3 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00D2FF]/15 text-[#00D2FF] shrink-0">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white group-hover:text-[#00D2FF] transition-colors leading-tight">
                New to trading?
              </span>
              <span className="text-[11px] text-[#8492A6] leading-tight mt-0.5 truncate">
                Learn what a market order is and how leverage works.
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#8492A6] group-hover:text-white shrink-0" />
        </NavLink>

        {/* Direction Button Group: Long (Green) | Short (Red/Dark) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => form.setValue('side', 'LONG')}
            className={[
              'flex items-center justify-center py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-xs',
              isLong
                ? 'bg-[#00F29D] text-black shadow-md shadow-[#00F29D]/20'
                : 'bg-[#141A26] border border-[#1E2738] text-[#8492A6] hover:text-white',
            ].join(' ')}
          >
            Long
          </button>
          <button
            type="button"
            onClick={() => form.setValue('side', 'SHORT')}
            className={[
              'flex items-center justify-center py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-xs',
              !isLong
                ? 'bg-[#FF4D5A] text-white shadow-md shadow-[#FF4D5A]/20'
                : 'bg-[#141A26] border border-[#1E2738] text-[#8492A6] hover:text-white',
            ].join(' ')}
          >
            Short
          </button>
        </div>

        {/* Order Type Tabs: Limit | Market | Stop */}
        <div className="flex items-center border-b border-[#1A2333] pb-1">
          {(['LIMIT', 'MARKET', 'STOP'] as const).map(type => (
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
                'flex-1 py-1.5 text-xs font-semibold transition-colors relative cursor-pointer',
                orderTypeTab === type
                  ? 'text-white'
                  : 'text-[#8492A6] hover:text-white',
              ].join(' ')}
            >
              <span>{type.charAt(0) + type.slice(1).toLowerCase()}</span>
              {orderTypeTab === type && (
                <span className="absolute bottom-[-5px] left-2 right-2 h-0.5 bg-[#00D2FF] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Price (USDT) Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="order-price" className="text-xs font-medium text-[#8492A6]">
            Price (USDT)
          </label>
          <div className="relative flex items-center">
            <input
              id="order-price"
              {...form.register('price')}
              disabled={orderTypeTab === 'MARKET'}
              placeholder="67432.1"
              className="w-full rounded-xl border border-[#1A2333] bg-[#111622] px-3 py-2 text-sm text-white font-mono tabular-nums placeholder:text-[#556377] focus:border-[#7052FF] focus:outline-none disabled:opacity-50"
            />
            {orderTypeTab !== 'MARKET' && (
              <button
                type="button"
                onClick={() => form.setValue('price', '67432.1')}
                className="absolute right-2.5 rounded-lg bg-[#1D273B] hover:bg-[#25324C] px-2 py-0.5 text-xs font-semibold text-[#00D2FF] transition-colors cursor-pointer"
              >
                Mid
              </button>
            )}
          </div>
        </div>

        {/* Size (BTC) Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="order-size" className="text-xs font-medium text-[#8492A6]">
            Size (BTC)
          </label>
          <div className="relative flex items-center">
            <input
              id="order-size"
              {...form.register('quantity')}
              placeholder="0.01"
              className="w-full rounded-xl border border-[#1A2333] bg-[#111622] px-3 py-2 pr-28 text-sm text-white font-mono tabular-nums placeholder:text-[#556377] focus:border-[#7052FF] focus:outline-none"
            />
            <span className="absolute right-3 text-xs font-mono text-[#8492A6] pointer-events-none">
              ≈ {notionalUSDT} USDT
            </span>
          </div>
        </div>

        {/* Percentage Preset Slider / Marks */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-0.5 text-[10px] font-mono text-[#8492A6]">
            {PERCENT_PRESETS.map(pct => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentClick(pct)}
                className="hover:text-white cursor-pointer py-1"
              >
                {pct}%
              </button>
            ))}
          </div>
          <div className="h-1 w-full rounded-full bg-[#1A2333] relative">
            <div className="h-full bg-[#00D2FF] rounded-full" style={{ width: '25%' }} />
          </div>
        </div>

        {/* Leverage Slider Section */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8492A6]">Leverage</span>
            <button
              type="button"
              className="flex items-center gap-1 text-xs font-bold font-mono text-[#00D2FF] hover:underline cursor-pointer"
            >
              <span>{currentLeverage}x</span>
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>

          <Controller
            control={form.control}
            name="leverage"
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={field.value}
                  onChange={e => field.onChange(e.target.value)}
                  className="w-full h-1.5 bg-[#1A2333] rounded-lg appearance-none cursor-pointer accent-[#00D2FF]"
                />
                <div className="flex items-center justify-between text-[10px] font-mono text-[#8492A6] px-0.5">
                  {LEVERAGE_TICKS.map(tick => (
                    <button
                      key={tick}
                      type="button"
                      onClick={() => field.onChange(String(tick))}
                      className={[
                        'cursor-pointer hover:text-white',
                        currentLeverage === tick ? 'text-[#00D2FF] font-bold' : '',
                      ].join(' ')}
                    >
                      {tick}x
                    </button>
                  ))}
                </div>
              </div>
            )}
          />
        </div>

        {/* Order Preview Breakdown */}
        <div className="flex flex-col gap-2 rounded-xl bg-[#111622] p-3 text-xs font-mono border border-[#1A2333]/50 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-[#8492A6] font-sans">Required Margin</span>
            <span className="text-white font-bold tabular-nums">{requiredMargin} USDT</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#8492A6] font-sans">Est. Liquidation Price</span>
            <span className="text-white font-bold tabular-nums">{estLiqPrice}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#8492A6] font-sans">Est. Fee</span>
            <span className="text-white font-bold tabular-nums">{estFee} USDT</span>
          </div>
        </div>

        {/* Big Action Button */}
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
              'w-full rounded-xl py-3 px-4 flex flex-col items-center justify-center transition-all cursor-pointer font-sans shadow-lg',
              isLong
                ? 'bg-[#00F29D] hover:bg-[#00DC8E] text-black shadow-[#00F29D]/20'
                : 'bg-[#FF4D5A] hover:bg-[#EE404D] text-white shadow-[#FF4D5A]/20',
              mutation.isPending ? 'opacity-70 pointer-events-none' : '',
            ].join(' ')}
          >
            <span className="text-sm font-extrabold leading-tight">
              {mutation.isPending
                ? 'Submitting…'
                : isLong
                ? 'Open Long (Demo)'
                : 'Open Short (Demo)'}
            </span>
            <span className="text-[11px] font-semibold opacity-85 font-mono leading-tight mt-0.5">
              ≈ {displaySize} BTC
            </span>
          </button>
        </div>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
