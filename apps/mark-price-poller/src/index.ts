export interface PollerOptions {
  startPrice: bigint;
  intervalMs?: number;
  // Largest move per tick, in the same units as the price.
  stepSize?: bigint;
}

/**
 * Emits an index price on a timer. This is a fake — a random walk around a starting price,
 * not a real external feed — but it is a price the exchange does not control, which is the
 * whole point of using an index for liquidations instead of our own last traded price.
 *
 * Swapping this for a real Binance feed does not change the interface.
 */
export function startPoller(
  { startPrice, intervalMs = 1000, stepSize = 50n }: PollerOptions,
  onPrice: (price: bigint) => void,
): () => void {
  let price = startPrice;

  const timer = setInterval(() => {
    const step = BigInt(Math.floor(Math.random() * Number(stepSize * 2n + 1n))) - stepSize;
    price += step;

    if (price < 1n) {
      price = 1n;
    }

    onPrice(price);
  }, intervalMs);

  return () => clearInterval(timer);
}

if (import.meta.main) {
  startPoller({ startPrice: 50_000n }, price => console.log(`BTC-PERP index ${price}`));
}
