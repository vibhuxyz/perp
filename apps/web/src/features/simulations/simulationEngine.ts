import type { UTCTimestamp } from 'lightweight-charts';
import type { CandlestickData } from '../trade/components/chartData';
import type { PricePoint, SimulationResult, ScenarioId } from './types';

function interpolateBetween(cur: PricePoint, next: PricePoint, timeSec: number): PricePoint {
  const span = next.timeSec - cur.timeSec;
  const progress = span > 0 ? (timeSec - cur.timeSec) / span : 0;
  const price = cur.price + (next.price - cur.price) * progress;
  const volume = cur.volume + (next.volume - cur.volume) * progress;
  return { timeSec, price: Math.round(price * 10) / 10, volume: Math.round(volume * 10) / 10 };
}

function findInterpolated(points: PricePoint[], timeSec: number): PricePoint | undefined {
  for (let i = 0; i < points.length - 1; i++) {
    const cur = points[i];
    const next = points[i + 1];
    if (cur && next && timeSec >= cur.timeSec && timeSec <= next.timeSec) {
      return interpolateBetween(cur, next, timeSec);
    }
  }
  return undefined;
}

export function getInterpolatedPoint(points: PricePoint[], timeSec: number): PricePoint {
  const fallback: PricePoint = { timeSec, price: 50000, volume: 10 };
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return fallback;
  if (timeSec <= first.timeSec) return first;
  if (timeSec >= last.timeSec) return last;
  return findInterpolated(points, timeSec) ?? last;
}

export function generateCandlesFromPoints(
  points: PricePoint[],
  upToSec: number,
  baseTimestamp: number,
  candleSpanSec = 5,
): CandlestickData[] {
  const candles: CandlestickData[] = [];
  const currentSlot = Math.floor(upToSec / candleSpanSec) * candleSpanSec;

  for (let slot = 0; slot <= currentSlot; slot += candleSpanSec) {
    const startPt = getInterpolatedPoint(points, slot);
    const mid1 = getInterpolatedPoint(points, slot + candleSpanSec * 0.33);
    const mid2 = getInterpolatedPoint(points, slot + candleSpanSec * 0.66);
    const endPt = getInterpolatedPoint(points, Math.min(slot + candleSpanSec, upToSec));

    const prices = [startPt.price, mid1.price, mid2.price, endPt.price];
    const open = startPt.price;
    const close = endPt.price;
    const high = Math.max(...prices);
    const low = Math.min(...prices);

    candles.push({
      time: (baseTimestamp + slot) as UTCTimestamp,
      open,
      high,
      low,
      close,
    });
  }

  return candles;
}

export function calculateLiquidationPrice(side: 'LONG' | 'SHORT', entryPrice: number, leverage: number): number {
  const mmr = 0.05;
  if (side === 'LONG') {
    const factor = 1 - 1 / leverage + mmr;
    return Math.max(1, Math.round(entryPrice * factor * 10) / 10);
  }
  const factor = 1 + 1 / leverage - mmr;
  return Math.round(entryPrice * factor * 10) / 10;
}

export function calculateUnrealizedPnL(
  side: 'LONG' | 'SHORT',
  entryPrice: number,
  currentPrice: number,
  quantity: number,
): number {
  const diff = side === 'LONG' ? currentPrice - entryPrice : entryPrice - currentPrice;
  return Math.round(diff * quantity * 100) / 100;
}

export function evaluateScorecard(
  scenarioId: ScenarioId,
  title: string,
  initialBal: number,
  finalBal: number,
  maxDrawdown: number,
  wasLiquidated: boolean,
): SimulationResult {
  const netPnL = Math.round((finalBal - initialBal) * 100) / 100;
  const roiPct = Math.round((netPnL / initialBal) * 1000) / 10;

  let grade: SimulationResult['grade'] = 'B';
  let feedback = 'You survived the market volatility with protected equity.';

  if (wasLiquidated) {
    grade = 'F';
    feedback = 'Liquidated! High leverage during extreme volatility breached your maintenance margin.';
  } else if (roiPct >= 20 && maxDrawdown < 15) {
    grade = 'S';
    feedback = 'Exceptional risk execution! Capitalized on the crisis while maintaining disciplined risk.';
  } else if (roiPct > 0) {
    grade = 'A';
    feedback = 'Solid performance. Closed positive returns in harsh market conditions.';
  } else if (maxDrawdown > 40) {
    grade = 'C';
    feedback = 'Barely survived. Extreme drawdown suggests overexposure to volatile wicks.';
  }

  return {
    scenarioId,
    scenarioTitle: title,
    survived: !wasLiquidated,
    liquidated: wasLiquidated,
    initialBalance: initialBal,
    finalBalance: finalBal,
    netPnL,
    roiPct,
    maxDrawdownPct: Math.round(maxDrawdown * 10) / 10,
    closestMarginRatioPct: wasLiquidated ? 100 : Math.min(95, Math.round(maxDrawdown * 1.5)),
    grade,
    feedback,
  };
}
