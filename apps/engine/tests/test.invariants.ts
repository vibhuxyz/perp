import { Exchange } from "../src/core/Exchange";
import { settleFunding } from "../src/risk/funding";
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
    leverage: 1n,
    status: "resting",
    createdAt: new Date(),
    ...o,
  };
}

function snapshotUserState(ex: Exchange, userId: string) {
  const col = ex.ledger.usersCollateral.get(userId);
  const pos = ex.ledger.getPosition(userId, "BTC-PERP");
  const avail = col ? col.availableBalance.toString() : "0";
  const locked = col ? col.marginLocked.toString() : "0";
  const qty = pos ? pos.quantity.toString() : "0";
  const avg = pos ? pos.averagePrice.toString() : "0";
  const margin = pos ? pos.margin.toString() : "0";
  return { avail, locked, qty, avg, margin };
}

console.log("\nInvariant Suite M1-M4: Matching Engine");

const exM = new Exchange();
exM.createMarket("BTC-PERP");
exM.deposit("u1", 10_000_000n);
exM.deposit("u2", 10_000_000n);
exM.deposit("u3", 10_000_000n);

exM.placeOrder(makeOrder({ userId: "u1", orderId: "b1", side: "LONG", type: "LIMIT", price: 49_000n, quantity: 5n, leverage: 1n }));
exM.placeOrder(makeOrder({ userId: "u2", orderId: "b2", side: "LONG", type: "LIMIT", price: 50_000n, quantity: 3n, leverage: 1n }));
exM.placeOrder(makeOrder({ userId: "u3", orderId: "b3", side: "LONG", type: "LIMIT", price: 50_000n, quantity: 4n, leverage: 1n }));

const fillsM = exM.placeOrder(makeOrder({ userId: "u1", orderId: "s1", side: "SHORT", type: "MARKET", quantity: 5n, leverage: 1n }));

check("M1: Order never executes more quantity than requested", fillsM.reduce((sum, f) => sum + f.quantity, 0n), 5n);
check("M3: Better price filled first (50000 before 49000)", fillsM[0]?.price, 50_000n);
check("M3: Earlier arrival filled first at same price (b2 before b3)", fillsM[0]?.makerOrderId, "b2");
check("M3: Second fill at 50000 takes remainder from b3", fillsM[1]?.makerOrderId, "b3");
check("M3: Second fill quantity matches remainder", fillsM[1]?.quantity, 2n);

const book = exM.matchingEngine.orderbooks.get("BTC-PERP");
const maxBid = book ? Math.max(...Array.from(book.bids.keys()).map(Number)) : 0;
const minAsk = book ? Math.min(...Array.from(book.asks.keys()).map(Number)) : Infinity;
check("M4: Book never rests crossed (maxBid < minAsk)", maxBid < minAsk, true);

function runSeededSequence(): string {
  const ex = new Exchange();
  ex.createMarket("BTC-PERP");
  ex.deposit("seed1", 5_000_000n);
  ex.deposit("seed2", 5_000_000n);

  ex.placeOrder(makeOrder({ userId: "seed1", orderId: "s_a", side: "LONG", type: "LIMIT", price: 48_000n, quantity: 10n, leverage: 2n }));
  ex.placeOrder(makeOrder({ userId: "seed2", orderId: "s_b", side: "SHORT", type: "MARKET", quantity: 6n, leverage: 2n }));
  ex.placeOrder(makeOrder({ userId: "seed2", orderId: "s_c", side: "SHORT", type: "LIMIT", price: 49_000n, quantity: 4n, leverage: 2n }));
  ex.placeOrder(makeOrder({ userId: "seed1", orderId: "s_d", side: "LONG", type: "MARKET", quantity: 2n, leverage: 2n }));

  return JSON.stringify({
    u1: snapshotUserState(ex, "seed1"),
    u2: snapshotUserState(ex, "seed2"),
  });
}

const run1 = runSeededSequence();
const run2 = runSeededSequence();
check("M2: Matching is deterministic (identical state on repeat runs)", run1, run2);

console.log("\nInvariant Suite L1-L4: Ledger & Money");

const exL = new Exchange();
exL.createMarket("BTC-PERP");
exL.deposit("l1", 1_000_000n);
exL.deposit("l2", 1_000_000n);

const totalDeposits = 2_000_000n;

exL.placeOrder(makeOrder({ userId: "l1", orderId: "lo1", side: "LONG", type: "LIMIT", price: 50_000n, quantity: 4n, leverage: 2n }));
const crossFills = exL.placeOrder(makeOrder({ userId: "l2", orderId: "lo2", side: "SHORT", type: "MARKET", quantity: 4n, leverage: 2n }));

check("L4: Every fill changes both sides by equal quantity", crossFills.every(f => f.quantity === 4n), true);

const u1Col = exL.ledger.usersCollateral.get("l1");
const u2Col = exL.ledger.usersCollateral.get("l2");
const u1Avail = u1Col?.availableBalance ?? -1n;
const u2Avail = u2Col?.availableBalance ?? -1n;
check("L1: No available balance is negative", u1Avail >= 0n && u2Avail >= 0n, true);

const u1Locked = u1Col?.marginLocked ?? -1n;
const u2Locked = u2Col?.marginLocked ?? -1n;
check("L1: No locked margin is negative", u1Locked >= 0n && u2Locked >= 0n, true);

const totalAccounted = (u1Col?.availableBalance ?? 0n) + (u1Col?.marginLocked ?? 0n) +
  (u2Col?.availableBalance ?? 0n) + (u2Col?.marginLocked ?? 0n);
check("L2: deposits == available + locked margin", totalAccounted, totalDeposits);

const fundingPayments = settleFunding(exL.ledger, "BTC-PERP", 51_000n, 50_000n);
const netFunding = fundingPayments.reduce((acc, p) => acc + p.amount, 0n);
check("L3: Funding payments net to zero across longs and shorts", netFunding, 0n);

console.log("\nInvariant Suite R1-R4: Risk & Liquidation");

const exR = new Exchange();
exR.createMarket("BTC-PERP");
exR.deposit("trader", 100_000n);
exR.deposit("liquidator", 1_000_000n);

exR.placeOrder(makeOrder({ userId: "liquidator", orderId: "r_m1", side: "SHORT", type: "LIMIT", price: 50_000n, quantity: 2n, leverage: 10n }));
exR.placeOrder(makeOrder({ userId: "trader", orderId: "r_t1", side: "LONG", type: "MARKET", quantity: 2n, leverage: 10n }));

check("R2: Safe position is not liquidated when equity > MMR", exR.riskManager.checkLiquidations("BTC-PERP", 50_000n).length, 0);

exR.placeOrder(makeOrder({ userId: "liquidator", orderId: "r_bid", side: "LONG", type: "LIMIT", price: 44_000n, quantity: 2n, leverage: 10n }));
const liqResult = exR.riskManager.checkLiquidations("BTC-PERP", 44_000n);
check("R2: Breaching position is liquidated when equity <= MMR", liqResult.length, 1);
check("R4: Liquidation settles from actual fills (position closed)", exR.ledger.getPosition("trader", "BTC-PERP"), undefined);

console.log(`\n${failures === 0 ? "all invariants passed" : `${failures} invariant check(s) failed`}\n`);
process.exit(failures === 0 ? 0 : 1);
