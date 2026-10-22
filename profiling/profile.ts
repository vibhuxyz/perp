import { monitorEventLoopDelay } from "node:perf_hooks";
import { Orderbook } from "../apps/engine/src/core/orderbook";
import type { Order } from "../apps/engine/src/types/index";

function createOrder(id: string, side: "LONG" | "SHORT", price: bigint, qty: bigint): Order {
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

export async function profileEngine(): Promise<void> {
  const histogram = monitorEventLoopDelay({ resolution: 20 });
  histogram.enable();

  const book = new Orderbook("BTC-PERP");
  const orderCount = 20_000;

  console.log(`\n=== Profiling Matching Engine (${orderCount.toLocaleString()} orders) ===`);

  let totalSortDurationNs = 0n;
  const originalKeys = Map.prototype.keys;

  const tStart = process.hrtime.bigint();

  for (let i = 0; i < orderCount; i++) {
    const side = i % 2 === 0 ? "LONG" : "SHORT";
    const basePrice = side === "LONG" ? 49000n : 51000n;
    const offset = BigInt(i % 1000);
    const price = side === "LONG" ? basePrice - offset : basePrice + offset;

    const tSort0 = process.hrtime.bigint();
    const opposing = side === "LONG" ? book.asks : book.bids;
    Array.from(opposing.keys()).sort((a, b) => Number(a - b));
    const tSort1 = process.hrtime.bigint();
    totalSortDurationNs += (tSort1 - tSort0);

    book.processOrder(createOrder(`ord_${i}`, side, price, 1n));
  }

  const tEnd = process.hrtime.bigint();
  histogram.disable();

  const totalDurationMs = Number(tEnd - tStart) / 1_000_000;
  const sortDurationMs = Number(totalSortDurationNs) / 1_000_000;
  const sortPercent = Math.round((sortDurationMs / totalDurationMs) * 10000) / 100;

  console.log(`Total duration:     ${totalDurationMs.toFixed(2)} ms`);
  console.log(`Key sort duration:  ${sortDurationMs.toFixed(2)} ms (${sortPercent}% of runtime)`);
  console.log(`Throughput:         ${Math.round((orderCount / (totalDurationMs / 1000)) * 100) / 100} orders/sec`);
  console.log(`Event Loop Min:     ${(histogram.min / 1_000_000).toFixed(3)} ms`);
  console.log(`Event Loop Mean:    ${(histogram.mean / 1_000_000).toFixed(3)} ms`);
  console.log(`Event Loop p50:     ${(histogram.percentile(50) / 1_000_000).toFixed(3)} ms`);
  console.log(`Event Loop p90:     ${(histogram.percentile(90) / 1_000_000).toFixed(3)} ms`);
  console.log(`Event Loop p99:     ${(histogram.percentile(99) / 1_000_000).toFixed(3)} ms`);
  console.log(`Event Loop Max:     ${(histogram.max / 1_000_000).toFixed(3)} ms\n`);
}

if (import.meta.main) {
  profileEngine().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
