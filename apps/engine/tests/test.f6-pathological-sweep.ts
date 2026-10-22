import { Orderbook } from "../src/core/orderbook";
import type { Order } from "../src/types/index";

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const pass = actual === expected;
  if (!pass) failures++;
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}${pass ? "" : ` — got ${actual}, want ${expected}`}`);
}

console.log("\nFailure Experiment F6: Pathological Book Sweep (Invariants M1, M4, L4)");

const book = new Orderbook("BTC-PERP");
const restingCount = 10_000;
const basePrice = 50_000n;

for (let i = 1; i <= restingCount; i++) {
  const askOrder: Order = {
    orderId: `ask_${i}`,
    userId: `maker_${i}`,
    market: "BTC-PERP",
    side: "SHORT",
    type: "LIMIT",
    price: basePrice + BigInt(i),
    quantity: 1n,
    leverage: 10n,
    status: "resting",
    createdAt: new Date(),
  };
  book.processOrder(askOrder);
}

check("seeded resting asks count", book.asks.size, restingCount);

const sweepTakerOrder: Order = {
  orderId: "taker_sweep_1",
  userId: "taker_whale",
  market: "BTC-PERP",
  side: "LONG",
  type: "MARKET",
  price: 0n,
  quantity: BigInt(restingCount),
  leverage: 10n,
  status: "resting",
  createdAt: new Date(),
};

const t0 = process.hrtime.bigint();
const fills = book.processOrder(sweepTakerOrder);
const t1 = process.hrtime.bigint();
const durationMs = Number(t1 - t0) / 1_000_000;

check("fills length matches resting order count", fills.length, restingCount);
check("M1: taker order completely executed", sweepTakerOrder.quantity, 0n);

let totalMakerQty = 0n;
let pricePriorityViolations = 0;
let prevPrice = 0n;

for (let i = 0; i < fills.length; i++) {
  const fill = fills[i];
  if (!fill) {
    continue;
  }
  if (fill.price < prevPrice) {
    pricePriorityViolations++;
  }
  prevPrice = fill.price;
  totalMakerQty += fill.quantity;
}

check("M3: price priority maintained across all fills", pricePriorityViolations, 0);
check("L4: conservation of quantity across all fills", totalMakerQty, BigInt(restingCount));
check("opposing asks book completely swept", book.asks.size, 0);
check("M4: no resting bids remaining", book.bids.size, 0);

const firstFill = fills[0];
const lastFill = fills[fills.length - 1];
check("first fill executed at best ask", firstFill?.price, basePrice + 1n);
check("last fill executed at worst swept price", lastFill?.price, basePrice + BigInt(restingCount));
check("lastTradePrice updated to final swept price", book.lastTradePrice, basePrice + BigInt(restingCount));

console.log(`\n  F6 execution time: ${durationMs.toFixed(2)} ms (${Math.round((restingCount / (durationMs / 1000)) * 100) / 100} fills/sec)`);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
} else {
  console.log("\nF6 pathological sweep experiment passed\n");
}
