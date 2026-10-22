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
    leverage: 1n,
    status: "resting",
    createdAt: new Date(),
    ...o,
  };
}

console.log("\nFailure Experiment F4: Scam Wick on Local Book (Invariant R1)");

const ex = new Exchange();
ex.createMarket("BTC-PERP");
ex.deposit("alice", 1_000_000n);
ex.deposit("bob", 10_000_000n);
ex.deposit("manipulator", 10_000_000n);

ex.placeOrder(makeOrder({ userId: "bob", orderId: "b1", side: "SHORT", type: "LIMIT", price: 50_000n, quantity: 10n, leverage: 10n }));
ex.placeOrder(makeOrder({ userId: "alice", orderId: "a1", side: "LONG", type: "MARKET", quantity: 10n, leverage: 10n }));

check("Alice holds LONG 10 @ 50000", ex.ledger.getPosition("alice", "BTC-PERP")?.quantity, 10n);

const stableIndexPrice = 50_000n;

ex.placeOrder(makeOrder({ userId: "bob", orderId: "b_low", side: "LONG", type: "LIMIT", price: 1_000n, quantity: 1n, leverage: 1n }));
const scamFills = ex.placeOrder(makeOrder({ userId: "manipulator", orderId: "wick", side: "SHORT", type: "MARKET", quantity: 1n, leverage: 1n }));

const book = ex.matchingEngine.orderbooks.get("BTC-PERP");
check("Local book last trade crashed to 1000", book?.lastTradePrice, 1_000n);
check("Scam wick fill executed at 1000", scamFills[0]?.price, 1_000n);

const liquidationsDuringWick = ex.riskManager.checkLiquidations("BTC-PERP", stableIndexPrice);
const aliceLiquidatedDuringWick = liquidationsDuringWick.some(p => p.userId === "alice");
check("R1: Alice is NOT liquidated by local scam wick while index is stable", aliceLiquidatedDuringWick, false);
check("Alice position remains intact", ex.ledger.getPosition("alice", "BTC-PERP")?.quantity, 10n);

ex.placeOrder(makeOrder({ userId: "bob", orderId: "b_exit", side: "LONG", type: "LIMIT", price: 44_000n, quantity: 10n, leverage: 10n }));
const realCrashIndexPrice = 44_000n;
const realLiquidations = ex.riskManager.checkLiquidations("BTC-PERP", realCrashIndexPrice);
const aliceLiquidatedOnRealCrash = realLiquidations.some(p => p.userId === "alice");
check("R1/R2: Alice is properly liquidated when external index price crashes", aliceLiquidatedOnRealCrash, true);
check("Alice position is closed after real index crash", ex.ledger.getPosition("alice", "BTC-PERP"), undefined);

console.log(`\n${failures === 0 ? "F4 experiment passed" : `${failures} check(s) failed`}\n`);
process.exit(failures === 0 ? 0 : 1);
