export interface PollerOptions {
  startPrice: bigint;
  intervalMs?: number;
  stepSize?: bigint;
  symbol?: string;
  source?: "binance" | "simulated";
}

export async function fetchBinancePrice(symbol = "BTCUSDT"): Promise<bigint | null> {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { price?: string };
    if (!data.price) {
      return null;
    }
    const parsed = Math.round(parseFloat(data.price));
    return parsed > 0 ? BigInt(parsed) : null;
  } catch {
    return null;
  }
}

export function startPoller(
  {
    startPrice,
    intervalMs = 1000,
    stepSize = 50n,
    symbol = "BTCUSDT",
    source = "binance",
  }: PollerOptions,
  onPrice: (price: bigint) => void,
): () => void {
  let price = startPrice;

  const tick = async () => {
    if (source === "binance") {
      const livePrice = await fetchBinancePrice(symbol);
      if (livePrice !== null) {
        price = livePrice;
        onPrice(price);
        return;
      }
    }

    const step = BigInt(Math.floor(Math.random() * Number(stepSize * 2n + 1n))) - stepSize;
    price += step;

    if (price < 1n) {
      price = 1n;
    }

    onPrice(price);
  };

  const timer = setInterval(() => {
    void tick();
  }, intervalMs);

  return () => clearInterval(timer);
}

if (import.meta.main) {
  console.log("[MarkPricePoller] Price feed worker started");
  const feeds = [
    { name: "BTC-PERP", symbol: "BTCUSDT", startPrice: 50_000n, stepSize: 50n },
    { name: "ETH-PERP", symbol: "ETHUSDT", startPrice: 3_000n, stepSize: 5n },
    { name: "SOL-PERP", symbol: "SOLUSDT", startPrice: 150n, stepSize: 1n },
  ];
  for (const f of feeds) {
    startPoller({ symbol: f.symbol, startPrice: f.startPrice, stepSize: f.stepSize }, price => {
      console.log(`[Poller] ${f.name} index: $${price.toString()}`);
    });
  }
}
