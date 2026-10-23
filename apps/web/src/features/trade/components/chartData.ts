import type { UTCTimestamp } from 'lightweight-charts';

export interface CandlestickData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface VolumeData {
  time: UTCTimestamp;
  value: number;
  color: string;
}

export interface HoverData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePct: number;
  isUp: boolean;
  x: number;
  y: number;
}

export const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D'] as const;
export const RANGES = ['1D', '5D', '1M', '3M', '6M', '1Y', 'All'] as const;

export const TIMEFRAME_SECONDS: Record<string, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1D': 86400,
};

export function formatChartTimestamp(ts: number): string {
  const d = new Date(ts * 1000);
  const day = d.getUTCDate().toString().padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  const hours = d.getUTCHours().toString().padStart(2, '0');
  const mins = d.getUTCMinutes().toString().padStart(2, '0');
  const secs = d.getUTCSeconds().toString().padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${mins}:${secs} UTC`;
}

export function generateInitialCandles(
  basePrice: number,
  count = 60,
  intervalSeconds = 3600
): {
  candles: CandlestickData[];
  volumes: VolumeData[];
} {
  const now = Math.floor(Date.now() / 1000);
  const currentSlot = Math.floor(now / intervalSeconds) * intervalSeconds;
  const rawCandles: CandlestickData[] = [];
  const rawVolumes: VolumeData[] = [];

  let currentClose = basePrice;

  for (let i = 0; i < count; i++) {
    const time = (currentSlot - i * intervalSeconds) as UTCTimestamp;
    const volatility = currentClose * 0.0035;
    const change = Math.sin(i * 0.55) * volatility;
    const open = i === 0 ? currentClose - change : currentClose;
    const close = i === 0 ? currentClose : open + change;
    const spread = Math.abs(Math.cos(i * 0.77)) * volatility * 0.4;
    const high = Math.max(open, close) + spread;
    const low = Math.min(open, close) - spread;

    const isUp = close >= open;
    const volume = Math.round((8 + Math.abs(Math.sin(i * 0.9)) * 15) * 100) / 100;

    rawCandles.push({
      time,
      open: parseFloat(open.toFixed(1)),
      high: parseFloat(high.toFixed(1)),
      low: parseFloat(low.toFixed(1)),
      close: parseFloat(close.toFixed(1)),
    });

    rawVolumes.push({
      time,
      value: volume,
      color: isUp ? 'rgba(0, 242, 157, 0.4)' : 'rgba(255, 77, 90, 0.4)',
    });

    currentClose = open;
  }

  return {
    candles: rawCandles.reverse(),
    volumes: rawVolumes.reverse(),
  };
}

export function mapApiCandles(items: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>): {
  candles: CandlestickData[];
  volumes: VolumeData[];
} {
  const candles: CandlestickData[] = [];
  const volumes: VolumeData[] = [];
  for (const item of items) {
    const time = item.time as UTCTimestamp;
    candles.push({
      time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    });
    volumes.push({
      time,
      value: item.volume,
      color: item.close >= item.open ? 'rgba(0, 242, 157, 0.4)' : 'rgba(255, 77, 90, 0.4)',
    });
  }
  return { candles, volumes };
}

export function resolveCandleData(
  realCandles: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }> | undefined,
  effectivePrice: number,
  activeTimeframe: string,
): { candles: CandlestickData[]; volumes: VolumeData[] } {
  if (realCandles && realCandles.length > 0) {
    return mapApiCandles(realCandles);
  }
  const interval = TIMEFRAME_SECONDS[activeTimeframe] || 3600;
  return generateInitialCandles(effectivePrice, 60, interval);
}
