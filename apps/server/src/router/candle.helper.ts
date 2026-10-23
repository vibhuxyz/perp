const BINANCE_SYMBOLS: Record<string, string> = {
  "BTC-PERP": "BTCUSDT",
  "ETH-PERP": "ETHUSDT",
  "SOL-PERP": "SOLUSDT",
};

const BINANCE_INTERVALS: Record<string, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "1D": "1d",
  "1d": "1d",
  "1w": "1w",
};

const INTERVAL_SECONDS: Record<string, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1D": 86400,
  "1d": 86400,
  "1w": 604800,
};

export interface CandleDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function fetchBinanceKlines(
  market: string,
  interval = "1h",
  limit = 100,
): Promise<CandleDataPoint[] | null> {
  const symbol = BINANCE_SYMBOLS[market] || "BTCUSDT";
  const binanceInterval = BINANCE_INTERVALS[interval] || "1h";
  const boundedLimit = Math.min(Math.max(limit || 100, 10), 1000);

  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${binanceInterval}&limit=${boundedLimit}`,
      { signal: AbortSignal.timeout(4500) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<[number, string, string, string, string, string, ...unknown[]]>;
    if (!Array.isArray(data) || data.length === 0) return null;

    return data.map(k => ({
      time: Math.floor(k[0] / 1000),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
  } catch {
    return null;
  }
}

export function generateFallbackCandles(
  currentPrice: number,
  limit = 100,
  interval = "1h",
): CandleDataPoint[] {
  const count = Math.min(Math.max(limit || 100, 10), 1000);
  const stepSec = INTERVAL_SECONDS[interval] || 3600;
  const nowSec = Math.floor(Date.now() / 1000);
  const currentSlot = Math.floor(nowSec / stepSec) * stepSec;
  const result: CandleDataPoint[] = [];

  let lastClose = currentPrice;
  for (let i = count - 1; i >= 0; i--) {
    const time = currentSlot - i * stepSec;
    const wave = Math.sin(time / (stepSec * 6)) * (lastClose * 0.003);
    const open = Math.round(lastClose * 10) / 10;
    const close = Math.round((open + wave) * 10) / 10;
    const spread = Math.abs(close * 0.001);
    const high = Math.round((Math.max(open, close) + spread) * 10) / 10;
    const low = Math.round((Math.min(open, close) - spread) * 10) / 10;
    const volume = Math.round((20 + Math.abs(Math.sin(time) * 30)) * 10) / 10;

    result.push({ time, open, high, low, close, volume });
    lastClose = close;
  }

  return result;
}
