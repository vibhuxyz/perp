import { Orderbook } from "../apps/engine/src/core/orderbook";
import type { Fill, Order } from "../apps/engine/src/types/index";
import { PriceLevel } from "../apps/engine/src/core/orderbook";
import { runBenchmark, type BenchmarkResult } from "./harness";

function binarySearchInsert(arr: bigint[], val: bigint, ascending: boolean): void {
  let low = 0;
  let high = arr.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    const midVal = arr[mid] ?? 0n;
    const cmp = ascending ? midVal < val : midVal > val;
    if (cmp) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  arr.splice(low, 0, val);
}

export class SortedKeysOrderbook {
  public market: string;
  public bids: Map<bigint, PriceLevel>;
  public asks: Map<bigint, PriceLevel>;
  public sortedBidPrices: bigint[];
  public sortedAskPrices: bigint[];
  public lastTradePrice: bigint | null;

  constructor(market: string) {
    this.market = market;
    this.bids = new Map();
    this.asks = new Map();
    this.sortedBidPrices = [];
    this.sortedAskPrices = [];
    this.lastTradePrice = null;
  }

  public processOrder(order: Order): Fill[] {
    const fills = order.side === "LONG"
      ? this.matchLong(order)
      : this.matchShort(order);

    if (fills.length > 0) {
      this.lastTradePrice = fills[fills.length - 1]?.price ?? null;
    }

    return fills;
  }

  private matchAgainstBook(
    order: Order,
    opposingBook: Map<bigint, PriceLevel>,
    sortedPrices: bigint[],
    canCross: (bestPrice: bigint) => boolean,
  ): Fill[] {
    const fills: Fill[] = [];

    while (sortedPrices.length > 0 && order.quantity > 0n) {
      const bestPrice = sortedPrices[0];
      if (bestPrice === undefined) break;

      if (order.type === "LIMIT" && !canCross(bestPrice)) {
        break;
      }

      const priceLevel = opposingBook.get(bestPrice);
      if (!priceLevel) {
        sortedPrices.shift();
        continue;
      }

      while (priceLevel.orders.length > 0 && order.quantity > 0n) {
        const counterparty = priceLevel.orders[0];
        if (!counterparty) break;
        const tradeSize = order.quantity <= counterparty.quantity ? order.quantity : counterparty.quantity;

        fills.push({
          fillId: Math.random().toString(),
          market: this.market,
          price: counterparty.price,
          quantity: tradeSize,
          makerOrderId: counterparty.orderId,
          makerUserId: counterparty.userId,
          takerOrderId: order.orderId,
          takerUserId: order.userId,
          leverage: order.leverage,
          fee: 0,
          createdAt: new Date(),
        });

        order.quantity -= tradeSize;
        counterparty.quantity -= tradeSize;

        if (counterparty.quantity === 0n) {
          priceLevel.orders.shift();
        }
      }

      if (priceLevel.orders.length === 0) {
        opposingBook.delete(bestPrice);
        sortedPrices.shift();
      }
    }

    return fills;
  }

  private restIfUnfilled(
    order: Order,
    restingBook: Map<bigint, PriceLevel>,
    sortedPrices: bigint[],
    ascending: boolean,
  ): void {
    if (order.type !== "LIMIT" || order.quantity === 0n) return;

    let level = restingBook.get(order.price);
    if (!level) {
      level = new PriceLevel(order.price);
      restingBook.set(order.price, level);
      binarySearchInsert(sortedPrices, order.price, ascending);
    }
    level.orders.push(order);
  }

  private matchLong(order: Order): Fill[] {
    const fills = this.matchAgainstBook(order, this.asks, this.sortedAskPrices, p => p <= order.price);
    this.restIfUnfilled(order, this.bids, this.sortedBidPrices, false);
    return fills;
  }

  private matchShort(order: Order): Fill[] {
    const fills = this.matchAgainstBook(order, this.bids, this.sortedBidPrices, p => p >= order.price);
    this.restIfUnfilled(order, this.asks, this.sortedAskPrices, true);
    return fills;
  }
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export async function runComparison(): Promise<void> {
  const orderCount = 20_000;
  console.log(`\n=== Head-to-Head Comparison: Naive (Design A) vs Sorted Keys (Design B) [${orderCount.toLocaleString()} orders] ===`);

  const naiveBook = new Orderbook("BTC-PERP");
  const rngA = seededRandom(42);
  const resultA = await runBenchmark("Design A (Current: Array.from(keys).sort())", orderCount, i => {
    const side = i % 2 === 0 ? "LONG" : "SHORT";
    const basePrice = side === "LONG" ? 49000n : 51000n;
    const price = side === "LONG" ? basePrice - BigInt(Math.floor(rngA() * 1000)) : basePrice + BigInt(Math.floor(rngA() * 1000));
    naiveBook.processOrder({
      orderId: `ord_a_${i}`,
      userId: `user_${i}`,
      market: "BTC-PERP",
      side,
      type: "LIMIT",
      price,
      quantity: 1n,
      leverage: 10n,
      createdAt: new Date(),
    });
  });

  const sortedBook = new SortedKeysOrderbook("BTC-PERP");
  const rngB = seededRandom(42);
  const resultB = await runBenchmark("Design B (Sorted Price Keys + Map)", orderCount, i => {
    const side = i % 2 === 0 ? "LONG" : "SHORT";
    const basePrice = side === "LONG" ? 49000n : 51000n;
    const price = side === "LONG" ? basePrice - BigInt(Math.floor(rngB() * 1000)) : basePrice + BigInt(Math.floor(rngB() * 1000));
    sortedBook.processOrder({
      orderId: `ord_b_${i}`,
      userId: `user_${i}`,
      market: "BTC-PERP",
      side,
      type: "LIMIT",
      price,
      quantity: 1n,
      leverage: 10n,
      createdAt: new Date(),
    });
  });

  const speedup = Math.round((resultB.opsPerSec / resultA.opsPerSec) * 100) / 100;
  console.log(`\nSpeedup: Design B is ${speedup}x faster than Design A`);
  console.log(`p50 Latency: ${resultA.p50Ms} ms -> ${resultB.p50Ms} ms (${Math.round((resultA.p50Ms / resultB.p50Ms) * 10) / 10}x lower)`);
  console.log(`p99 Latency: ${resultA.p99Ms} ms -> ${resultB.p99Ms} ms (${Math.round((resultA.p99Ms / resultB.p99Ms) * 10) / 10}x lower)\n`);
}

if (import.meta.main) {
  runComparison().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
