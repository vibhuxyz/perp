import type { ISeriesApi, MouseEventParams, Time } from 'lightweight-charts';
import type { CandlestickData } from '../chartData';

export interface Ohlc {
  open: number;
  high: number;
  low: number;
  close: number;
}

export function hasCrosshairPoint(
  param: MouseEventParams<Time>,
): param is MouseEventParams<Time> & { point: { x: number; y: number } } {
  if (!param.point || !param.time) return false;
  return param.point.x >= 0 && param.point.y >= 0;
}

export function extractOhlc(
  param: MouseEventParams<Time>,
  candleSeries: ISeriesApi<'Candlestick'> | null,
  lineSeries: ISeriesApi<'Line'> | null,
): Ohlc | null {
  if (candleSeries) {
    const cData = param.seriesData.get(candleSeries) as CandlestickData | undefined;
    if (!cData || typeof cData.open !== 'number') return null;
    return { open: cData.open, high: cData.high, low: cData.low, close: cData.close };
  }
  if (lineSeries) {
    const lData = param.seriesData.get(lineSeries) as { value: number } | undefined;
    if (!lData || typeof lData.value !== 'number') return null;
    return { open: lData.value, high: lData.value, low: lData.value, close: lData.value };
  }
  return null;
}
