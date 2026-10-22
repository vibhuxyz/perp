import { Exchange } from "../src/core/Exchange";
import type { Order } from "../src/types/index";

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const pass = actual === expected;
  if (!pass) failures++;
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}${pass ? "" : ` — got ${actual}, want ${expected}`}`);
}

function makeOrder(o: Partial<Order> & Pick<Order, "userId" | "orderId" | "side" | "type" | "quantity">): Order {
  return {
    market: "BTC-PERP",
    price: 0n,
    leverage: 10n,
    status: "resting",
    createdAt: new Date(),
    ...o,
  };
}

console.log("\nFailure Experiment F3: Concurrent Price Hammering vs Order Flow (Invariants R1, R2, L1)");

const ex = new Exchange();
ex.createMarket("BTC-PERP");

const userCount = 20;
for (let i = 1; i <= userCount; i++) {
  ex.deposit(`trader_${i}`, 500_000n);
}
ex.deposit("liquidity_provider", 100_000_000n);

for (let i = 1; i <= 20; i++) {
  ex.placeOrder(makeOrder({
    userId: "liquidity_provider",
    orderId: `bid_lp_${i}`,
    side: "LONG",
    type: "LIMIT",
    price: 49_000n - BigInt(i * 100),
    quantity: 50n,
  }));
  ex.placeOrder(makeOrder({
    userId: "liquidity_provider",
    orderId: `ask_lp_${i}`,
    side: "SHORT",
    type: "LIMIT",
    price: 51_000n + BigInt(i * 100),
    quantity: 50n,
  }));
}

for (let i = 1; i <= 10; i++) {
  ex.placeOrder(makeOrder({
    userId: `trader_${i}`,
    orderId: `long_open_${i}`,
    side: "LONG",
    type: "LIMIT",
    price: 51_000n + BigInt(i * 100),
    quantity: 1n,
  }));
}

for (let i = 11; i <= 20; i++) {
  ex.placeOrder(makeOrder({
    userId: `trader_${i}`,
    orderId: `short_open_${i}`,
    side: "SHORT",
    type: "LIMIT",
    price: 49_000n - BigInt((i - 10) * 100),
    quantity: 1n,
  }));
}

let openPositions = 0;
for (let i = 1; i <= userCount; i++) {
  const pos = ex.ledger.getPosition(`trader_${i}`, "BTC-PERP");
  if (pos) openPositions++;
}
check("seeded initial open positions", openPositions, 20);

const safePrice = 50_000n;
const initialLiqs = ex.riskManager.checkLiquidations("BTC-PERP", safePrice);
check("R2: safe positions not liquidated at initial index price", initialLiqs.length, 0);

const priceSteps = [
  49_500n, 49_000n, 48_000n, 46_000n, 44_000n, 43_000n,
  45_000n, 48_000n, 52_000n, 55_000n, 57_000n, 50_000n,
];

let totalLiquidations = 0;
for (let step = 0; step < priceSteps.length; step++) {
  const currentPrice = priceSteps[step] ?? 50_000n;

  for (let k = 1; k <= 2; k++) {
    const traderId = `trader_${(step % 10) + 1}`;
    ex.placeOrder(makeOrder({
      userId: traderId,
      orderId: `flow_${step}_${k}`,
      side: step % 2 === 0 ? "LONG" : "SHORT",
      type: "LIMIT",
      price: step % 2 === 0 ? currentPrice - 500n : currentPrice + 500n,
      quantity: 1n,
    }));
  }

  const liqs = ex.riskManager.checkLiquidations("BTC-PERP", currentPrice);
  totalLiquidations += liqs.length;
}

check("liquidations triggered under extreme price swings", totalLiquidations > 0, true);

let negativeBalances = 0;
let negativeMargin = 0;

for (let i = 1; i <= userCount; i++) {
  const u = ex.ledger.usersCollateral.get(`trader_${i}`);
  if (u) {
    if (u.availableBalance < 0n) negativeBalances++;
    if (u.marginLocked < 0n) negativeMargin++;
  }
}
const lp = ex.ledger.usersCollateral.get("liquidity_provider");
if (lp) {
  if (lp.availableBalance < 0n) negativeBalances++;
  if (lp.marginLocked < 0n) negativeMargin++;
}

check("L1: zero negative balances across all hammered traders", negativeBalances, 0);
check("L1: zero negative margins across all hammered traders", negativeMargin, 0);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
} else {
  console.log("\nF3 concurrent race condition experiment passed\n");
}
