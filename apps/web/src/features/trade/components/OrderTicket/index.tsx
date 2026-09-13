import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrderForm } from '../../hooks/useOrderForm';
import { useAccountStore } from '@/stores/account.store';
import { useMarketStore, selectBestBid, selectBestAsk } from '@/stores/market.store';
import { fetchEquity } from '../../api/tradeApi';
import { AuthModal } from '@/features/auth/AuthModal';
import { AlertTriangle } from 'lucide-react';
import Decimal from 'decimal.js';
import { SideToggle } from './SideToggle';
import { OrderTypeTabs } from './OrderTypeTabs';
import { PriceInput } from './PriceInput';
import { QuantityInput } from './QuantityInput';
import { PercentSlider } from './PercentSlider';
import { OrderValueInput } from './OrderValueInput';
import { LeverageSlider } from './LeverageSlider';
import { LEVERAGE_STOPS } from '../../constants';
import { OrderSummary } from './OrderSummary';
import { LiquidationWarning } from './LiquidationWarning';
import { SubmitButton } from './SubmitButton';
import { useOrderTicketMath } from './useOrderTicketMath';

function computeEffectivePrice(
  values: { type: 'LIMIT' | 'MARKET'; price?: string },
  indexPrice: string | null,
): string {
  if (values.type === 'MARKET') return indexPrice ?? '0';
  const cleanPrice = values.price?.replace(/,/g, '');
  return cleanPrice || indexPrice || '0';
}

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
    if (indexPrice && !values.price) {
      form.setValue('price', indexPrice);
    }
  }, [indexPrice, form, values.price]);

  const isLong = values.side === 'LONG';
  const effectivePrice = computeEffectivePrice(values, indexPrice);

  const currentLeverage = LEVERAGE_STOPS[leverageStopIndex] ?? 10;
  const displayQuantity = values.quantity || '0';

  const {
    orderValueUSDT,
    requiredMargin,
    estLiqPrice,
    estFee,
    availableMarginNum,
    requiredMarginNum,
    marginUtilizationPct,
    liqDistancePct,
    isLiqClose,
  } = useOrderTicketMath({
    displayQuantity,
    effectivePrice,
    currentLeverage,
    isLong,
    margin,
    liquidation,
    indexPrice,
    availableBalance: equity?.availableBalance,
  });

  const handlePercentChange = (pct: number) => {
    setPercent(pct);
    const available = equity?.availableBalance ? parseFloat(equity.availableBalance) : 10000;
    const priceNum = parseFloat(effectivePrice) || (indexPrice ? parseFloat(indexPrice) : 0);
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
    const priceNum = parseFloat(effectivePrice) || (indexPrice ? parseFloat(indexPrice) : 0);
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
    const mid =
      bestBid && bestAsk ? new Decimal(bestBid).plus(bestAsk).div(2).toFixed(1) : (lastTradePrice ?? indexPrice ?? '');
    if (mid) form.setValue('price', mid);
  };

  const handleBboClick = () => {
    const bbo = isLong
      ? (bestAsk ?? lastTradePrice ?? indexPrice ?? '')
      : (bestBid ?? lastTradePrice ?? indexPrice ?? '');
    if (bbo) form.setValue('price', bbo);
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

  const handleSubmitClick = () => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
    } else {
      submitOrder();
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-[#0A0E17] rounded-xl border border-[#162032] p-3.5 gap-3.5 select-none overflow-y-auto scrollbar-thin">
        <SideToggle isLong={isLong} onSelect={side => form.setValue('side', side)} />

        <OrderTypeTabs
          selected={orderTypeTab}
          onSelect={type => {
            setOrderTypeTab(type);
            if (type === 'LIMIT' || type === 'MARKET') {
              form.setValue('type', type);
            }
          }}
        />

        <PriceInput
          register={form.register}
          isMarketOrder={orderTypeTab === 'MARKET'}
          indexPrice={indexPrice}
          onMidClick={handleMidClick}
          onBboClick={handleBboClick}
        />

        <QuantityInput register={form.register} />

        <PercentSlider percent={percent} onChange={handlePercentChange} />

        <OrderValueInput value={orderValueUSDT} onChange={handleOrderValueInput} />

        <LeverageSlider
          stopIndex={leverageStopIndex}
          onChangeIndex={handleLeverageChange}
          onReset={handleResetLeverage}
        />

        <OrderSummary
          requiredMargin={requiredMargin}
          requiredMarginNum={requiredMarginNum}
          marginUtilizationPct={marginUtilizationPct}
          availableMarginNum={availableMarginNum}
          estLiqPrice={estLiqPrice}
          liqDistancePct={liqDistancePct}
          isLiqClose={isLiqClose}
          estFee={estFee}
        />

        {isLiqClose && liqDistancePct !== null && (
          <LiquidationWarning estLiqPrice={estLiqPrice} liqDistancePct={liqDistancePct} />
        )}

        {mutation.error && (
          <div className="flex items-start gap-2 rounded-lg border border-loss/30 bg-loss/10 p-2.5 text-xs text-loss">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Order rejected: {mutation.error.message}</span>
          </div>
        )}

        {mutation.data && (
          <div className="rounded-lg border border-[#00DA8E]/30 bg-[#00DA8E]/10 p-2.5 text-xs text-[#00DA8E]">
            Order {mutation.data.status} · Filled {mutation.data.filledQuantity} BTC
          </div>
        )}

        <SubmitButton
          isAuthenticated={isAuthenticated}
          isLong={isLong}
          isPending={mutation.isPending}
          displayQuantity={displayQuantity}
          onClick={handleSubmitClick}
        />
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
