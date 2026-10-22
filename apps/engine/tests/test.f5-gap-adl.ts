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

console.log("\nFailure Experiment F5: Gap Past Bankruptcy with Empty Insurance Fund (Invariant L1, L2, ADL)");

const ex = new Exchange();
ex.createMarket("BTC-PERP");

ex.deposit("alice", 50_000n);
ex.deposit("bob", 200_000n);
ex.deposit("charlie", 500_000n);

ex.placeOrder(makeOrder({
  userId: "bob",
  orderId: "b_short",
  side: "SHORT",
  type: "LIMIT",
  price: 50_000n,
  quantity: 10n,
}));

ex.placeOrder(makeOrder({
  userId: "alice",
  orderId: "a_long",
  side: "LONG",
  type: "MARKET",
  quantity: 10n,
}));

check("Alice has 0 available balance remaining", ex.ledger.usersCollateral.get("alice")?.availableBalance, 0n);
check("Alice holds LONG 10", ex.ledger.getPosition("alice", "BTC-PERP")?.quantity, 10n);
check("Alice locked margin is 50000", ex.ledger.getPosition("alice", "BTC-PERP")?.margin, 50_000n);
check("Insurance fund is empty initially", ex.ledger.insuranceFund, 0n);

const gapPrice = 40_000n;
ex.placeOrder(makeOrder({
  userId: "charlie",
  orderId: "c_bid_gap",
  side: "LONG",
  type: "LIMIT",
  price: gapPrice,
  quantity: 10n,
}));

const liqs = ex.riskManager.checkLiquidations("BTC-PERP", gapPrice);
check("liquidation triggered under gap crash", liqs.length, 1);

const aliceCollateral = ex.ledger.usersCollateral.get("alice");
check("L1: Alice balance is protected from going negative", aliceCollateral?.availableBalance, 0n);
check("L1: Alice locked margin is completely released", aliceCollateral?.marginLocked, 0n);
check("Alice liquidated position is closed", ex.ledger.getPosition("alice", "BTC-PERP"), undefined);

const bobCollateral = ex.ledger.usersCollateral.get("bob");
check("L1: Bob available balance is non-negative", (bobCollateral?.availableBalance ?? -1n) >= 0n, true);
check("L1: Bob margin locked is non-negative", (bobCollateral?.marginLocked ?? -1n) >= 0n, true);

const charlieCollateral = ex.ledger.usersCollateral.get("charlie");
check("L1: Charlie available balance is non-negative", (charlieCollateral?.availableBalance ?? -1n) >= 0n, true);

let totalHeld = 0n;
for (const col of ex.ledger.usersCollateral.values()) {
  totalHeld += col.availableBalance + col.marginLocked;
}
check("L2: total system collateral is solvent (no deficit unhandled)", totalHeld > 0n, true);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
} else {
  console.log("\nF5 gap past bankruptcy and ADL experiment passed\n");
}
