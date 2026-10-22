import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrderForm } from '../../hooks/useOrderForm';
import { useAccountStore } from '@/stores/account.store';
import { useMarketStore, selectBestBid, selectBestAsk, MARKET_DETAILS } from '@/stores/market.store';
import { fetchEquity } from '../../api/tradeApi';
import { AuthModal } from '@/features/auth/AuthModal';
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
import { OptimisticStatusBanner } from './OptimisticStatusBanner';
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
  const [leverageStopIndex, setLeverageStopIndex] = useState<number>(2);

  const token = useAccountStore(s => s.token);
  const isAuthenticated = Boolean(token);
  const currentMarket = useMarketStore(s => s.currentMarket);
  const marketMeta = MARKET_DETAILS[currentMarket];

  const lastTradePrice = useMarketStore(s => s.lastTradePrice);
  const bestBid = useMarketStore(selectBestBid);
  const bestAsk = useMarketStore(selectBestAsk);

  const { data: equity } = useQuery({
    queryKey: ['equity', token],
    queryFn: fetchEquity,
    enabled: isAuthenticated,
    retry: false,
  });

  const {
    form,
    values,
    margin,
    liquidation,
    submitOrder,
    isSubmitting,
    optimisticStatus,
    lastError,
  } = useOrderForm(indexPrice, currentMarket);

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
    const maxQty = (available * currentLeverage) / priceNum;
    const calculated = (maxQty * (pct / 100)).toFixed(2);
    form.setValue('quantity', parseFloat(calculated) > 0 ? calculated : '0');
  };

  const handleOrderValueInput = (val: string) => {
    const cleanVal = val.replace(/,/g, '');
    const priceNum = parseFloat(effectivePrice) || (indexPrice ? parseFloat(indexPrice) : 0);
    if (priceNum <= 0) return;
    const numVal = parseFloat(cleanVal);
    const available = equity?.availableBalance ? parseFloat(equity.availableBalance) : 10000;
    const maxVal = available * currentLeverage;
    if (isNaN(numVal) || numVal <= 0) {
      form.setValue('quantity', '0');
      setPercent(0);
    } else {
      form.setValue('quantity', (numVal / priceNum).toFixed(4));
      setPercent(maxVal > 0 ? Math.min(100, Math.max(0, Math.round((numVal / maxVal) * 100))) : 0);
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
    form.setValue('leverage', String(LEVERAGE_STOPS[clamped] ?? 10));
  };

  return (
    <>
      <div className="flex flex-col h-full bg-[#0A0E17] rounded-xl border border-[#162032] p-3.5 gap-3.5 select-none overflow-y-auto scrollbar-thin">
        <SideToggle isLong={isLong} onSelect={side => form.setValue('side', side)} />
        <OrderTypeTabs
          selected={orderTypeTab}
          onSelect={type => {
            setOrderTypeTab(type);
            if (type === 'LIMIT' || type === 'MARKET') form.setValue('type', type);
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
          onReset={() => handleLeverageChange(2)}
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
        <OptimisticStatusBanner status={optimisticStatus} symbol={marketMeta.symbol} error={lastError} />
        <SubmitButton
          isAuthenticated={isAuthenticated}
          isLong={isLong}
          isPending={isSubmitting}
          optimisticStatus={optimisticStatus}
          displayQuantity={displayQuantity}
          baseAsset={marketMeta.baseAsset}
          onClick={() => (isAuthenticated ? submitOrder() : setIsAuthOpen(true))}
        />
      </div>
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
