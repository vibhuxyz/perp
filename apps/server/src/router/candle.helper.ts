export function generateFallbackCandles(
  currentPrice: number,
  limit = 100,
): Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }> {
  const now = Date.now();
  const candleCount = Math.min(limit || 100, 300);
  const candleDurationMs = 60_000;
  const result = [];

  let lastClose = currentPrice;
  for (let i = candleCount - 1; i >= 0; i--) {
    const time = Math.floor((now - i * candleDurationMs) / 1000);
    const variance = (Math.random() - 0.5) * (lastClose * 0.002);
    const open = Math.round(lastClose);
    const close = Math.max(1, Math.round(open + variance));
    const delta = Math.max(1, Math.round(lastClose * 0.001));
    const high = Math.max(open, close) + Math.round(Math.random() * delta);
    const low = Math.min(open, close) - Math.round(Math.random() * delta);
    const volume = Math.round(Math.random() * 50 + 5);

    result.push({ time, open, high, low, close, volume });
    lastClose = close;
  }

  return result;
}
