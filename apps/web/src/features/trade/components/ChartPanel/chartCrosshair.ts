import type { ISeriesApi, MouseEventParams, Time } from 'lightweight-charts';
import { formatChartTimestamp, type CandlestickData, type VolumeData, type HoverData } from '../chartData';

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

export function buildHoverData(
  param: MouseEventParams<Time> & { point: { x: number; y: number } },
  container: HTMLDivElement,
  ohlc: Ohlc,
  volumeSeries: ISeriesApi<'Histogram'>,
): HoverData {
  const { open, high, low, close } = ohlc;
  const vData = param.seriesData.get(volumeSeries) as VolumeData | undefined;
  const change = close - open;
  const changePct = open > 0 ? (change / open) * 100 : 0;
  const containerWidth = container.clientWidth || 700;
  const containerHeight = container.clientHeight || 400;

  return {
    time: formatChartTimestamp(param.time as number),
    open,
    high,
    low,
    close,
    volume: vData?.value ?? 0,
    change,
    changePct,
    isUp: close >= open,
    x: Math.min(param.point.x + 16, containerWidth - 225),
    y: Math.min(Math.max(param.point.y - 45, 12), containerHeight - 170),
  };
}
