import { Orderbook } from "../apps/engine/src/core/orderbook";
import type { Order } from "../apps/engine/src/types/index";
import { runBenchmark, type BenchmarkResult } from "./harness";

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function createLimitOrder(id: string, side: "LONG" | "SHORT", price: bigint, qty: bigint): Order {
  return {
    orderId: id,
    userId: `user_${id}`,
    market: "BTC-PERP",
    side,
    type: "LIMIT",
    price,
    quantity: qty,
    leverage: 10n,
    createdAt: new Date(),
  };
}

function createMarketOrder(id: string, side: "LONG" | "SHORT", qty: bigint): Order {
  return {
    orderId: id,
    userId: `user_${id}`,
    market: "BTC-PERP",
    side,
    type: "MARKET",
    price: 0n,
    quantity: qty,
    leverage: 10n,
    createdAt: new Date(),
  };
}

export async function runBookBenchmarks(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  const scales = [
    { label: "1x", count: 1_000 },
    { label: "10x", count: 10_000 },
    { label: "50x", count: 50_000 },
  ];

  for (const { label, count } of scales) {
    const book = new Orderbook("BTC-PERP");
    const rng = seededRandom(42);

    const insertResult = await runBenchmark(
      `Limit Insert (${label}: ${count} orders)`,
      count,
      (i: number) => {
        const side = i % 2 === 0 ? "LONG" : "SHORT";
        const basePrice = side === "LONG" ? 49000n : 51000n;
        const offset = BigInt(Math.floor(rng() * 1000));
        const price = side === "LONG" ? basePrice - offset : basePrice + offset;
        const order = createLimitOrder(`bench_${label}_${i}`, side, price, 1n);
        book.processOrder(order);
      },
    );
    results.push(insertResult);

    let sweepCount = 0;
    const matchResult = await runBenchmark(
      `Market Sweep (${label}: ${Math.min(count, 1000)} sweeps)`,
      Math.min(count, 1000),
      (i: number) => {
        const side = i % 2 === 0 ? "LONG" : "SHORT";
        const sweepOrder = createMarketOrder(`sweep_${label}_${i}`, side, 5n);
        const fills = book.processOrder(sweepOrder);
        sweepCount += fills.length;
      },
    );
    results.push(matchResult);
  }

  const pingPongBook = new Orderbook("BTC-PERP");
  const rng = seededRandom(1337);
  const tradeResult = await runBenchmark(
    "Trading Flow 10k (50% Maker Limit / 50% Taker Market)",
    10_000,
    (i: number) => {
      if (i % 2 === 0) {
        const side = rng() > 0.5 ? "LONG" : "SHORT";
        const price = side === "LONG" ? 50000n - BigInt(Math.floor(rng() * 50)) : 50000n + BigInt(Math.floor(rng() * 50));
        pingPongBook.processOrder(createLimitOrder(`flow_${i}`, side, price, 2n));
      } else {
        const side = rng() > 0.5 ? "LONG" : "SHORT";
        pingPongBook.processOrder(createMarketOrder(`flow_${i}`, side, 1n));
      }
    },
  );
  results.push(tradeResult);

  return results;
}

if (import.meta.main) {
  runBookBenchmarks().catch((err: unknown) => {
    console.error("Benchmark failed:", err);
    process.exit(1);
  });
}
