import { useMemo } from 'react';
import Decimal from 'decimal.js';

const oneDecimalFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function useOrderTicketMath({
  displayQuantity,
  effectivePrice,
  currentLeverage,
  isLong,
  margin,
  liquidation,
  indexPrice,
  availableBalance,
}: {
  displayQuantity: string;
  effectivePrice: string;
  currentLeverage: number;
  isLong: boolean;
  margin: Decimal | null;
  liquidation: Decimal | null;
  indexPrice: string | null;
  availableBalance: string | undefined;
}) {
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
    if (!displayQuantity || Number(displayQuantity) <= 0) return '—';
    if (liquidation) return oneDecimalFormatter.format(liquidation.toNumber());
    try {
      const p = new Decimal(effectivePrice);
      if (p.isZero()) return '—';
      const diff = p.div(currentLeverage);
      const liq = isLong ? p.minus(diff) : p.plus(diff);
      return oneDecimalFormatter.format(liq.toNumber());
    } catch {
      return '—';
    }
  }, [displayQuantity, liquidation, effectivePrice, currentLeverage, isLong]);

  const estFee = useMemo(() => {
    try {
      const val = new Decimal(orderValueUSDT);
      if (val.isZero()) return '0.0000';
      return val.times(0.0001).toFixed(4);
    } catch {
      return '0.0000';
    }
  }, [orderValueUSDT]);

  const availableMarginNum = useMemo(() => {
    if (!availableBalance) return 0;
    const num = parseFloat(availableBalance);
    return isNaN(num) ? 0 : num;
  }, [availableBalance]);

  const requiredMarginNum = useMemo(() => {
    const num = parseFloat(requiredMargin);
    return isNaN(num) ? 0 : num;
  }, [requiredMargin]);

  const marginUtilizationPct = useMemo(() => {
    if (requiredMarginNum <= 0) return 0;
    if (availableMarginNum <= 0) return 100;
    return (requiredMarginNum / availableMarginNum) * 100;
  }, [requiredMarginNum, availableMarginNum]);

  const liqDistancePct = useMemo(() => {
    if (estLiqPrice === '—') return null;
    const markNum = parseFloat(effectivePrice) || (indexPrice ? parseFloat(indexPrice) : 0);
    const liqNum = parseFloat(estLiqPrice.replace(/,/g, ''));
    if (markNum <= 0 || isNaN(liqNum) || liqNum <= 0) return null;
    return (Math.abs(markNum - liqNum) / markNum) * 100;
  }, [estLiqPrice, effectivePrice, indexPrice]);

  const isLiqClose = liqDistancePct !== null && liqDistancePct <= 20;

  return {
    orderValueUSDT,
    requiredMargin,
    estLiqPrice,
    estFee,
    availableMarginNum,
    requiredMarginNum,
    marginUtilizationPct,
    liqDistancePct,
    isLiqClose,
  };
}
