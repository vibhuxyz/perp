import type { UTCTimestamp } from 'lightweight-charts';
import type { CandlestickData } from '../chartData';

export interface IndicatorPoint {
  time: UTCTimestamp;
  value: number;
}

export function calculateSMA(candles: CandlestickData[], period: number): IndicatorPoint[] {
  if (candles.length < period) return [];
  const result: IndicatorPoint[] = [];

  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    if (!candle) continue;
    sum += candle.close;

    if (i >= period) {
      const prev = candles[i - period];
      if (prev) sum -= prev.close;
    }

    if (i >= period - 1) {
      result.push({
        time: candle.time,
        value: parseFloat((sum / period).toFixed(2)),
      });
    }
  }

  return result;
}

export function calculateEMA(candles: CandlestickData[], period: number): IndicatorPoint[] {
  if (candles.length < period) return [];
  const result: IndicatorPoint[] = [];
  const multiplier = 2 / (period + 1);

  let initialSum = 0;
  for (let i = 0; i < period; i++) {
    const c = candles[i];
    if (c) initialSum += c.close;
  }

  let prevEma = initialSum / period;
  const startCandle = candles[period - 1];
  if (startCandle) {
    result.push({ time: startCandle.time, value: parseFloat(prevEma.toFixed(2)) });
  }

  for (let i = period; i < candles.length; i++) {
    const candle = candles[i];
    if (!candle) continue;
    prevEma = (candle.close - prevEma) * multiplier + prevEma;
    result.push({
      time: candle.time,
      value: parseFloat(prevEma.toFixed(2)),
    });
  }

  return result;
}

export interface BollingerBandsResult {
  upper: IndicatorPoint[];
  middle: IndicatorPoint[];
  lower: IndicatorPoint[];
}

export function calculateBollingerBands(
  candles: CandlestickData[],
  period = 20,
  stdDevMultiplier = 2,
): BollingerBandsResult {
  const middle = calculateSMA(candles, period);
  const upper: IndicatorPoint[] = [];
  const lower: IndicatorPoint[] = [];

  const midMap = new Map<number, number>();
  for (const m of middle) midMap.set(m.time, m.value);

  for (let i = period - 1; i < candles.length; i++) {
    const candle = candles[i];
    if (!candle) continue;
    const mid = midMap.get(candle.time);
    if (mid === undefined) continue;

    let varianceSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const c = candles[j];
      if (c) varianceSum += (c.close - mid) ** 2;
    }

    const stdDev = Math.sqrt(varianceSum / period);
    upper.push({
      time: candle.time,
      value: parseFloat((mid + stdDevMultiplier * stdDev).toFixed(2)),
    });
    lower.push({
      time: candle.time,
      value: parseFloat((mid - stdDevMultiplier * stdDev).toFixed(2)),
    });
  }

  return { upper, middle, lower };
}
