import fs from "fs";
import { Exchange } from "../src/core/Exchange";
import { WriteAheadLog } from "../src/wal/wal";
import { reconcileLedger } from "../src/reconciliation/reconcile";
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

const WAL_PATH = `/tmp/test-corrupt-wal-${Date.now()}.log`;
if (fs.existsSync(WAL_PATH)) {
  fs.unlinkSync(WAL_PATH);
}

console.log("\nFailure Experiment F7: Corrupted WAL Tail Recovery");

const wal = new WriteAheadLog(WAL_PATH);
const ex = new Exchange(wal);
ex.createMarket("BTC-PERP");

ex.dispatch({
  id: "c1",
  type: "DEPOSIT",
  userId: "alice",
  amount: 1_000_000n,
  timestamp: Date.now(),
});

ex.dispatch({
  id: "c2",
  type: "DEPOSIT",
  userId: "bob",
  amount: 1_000_000n,
  timestamp: Date.now(),
});

ex.dispatch({
  id: "c3",
  type: "PLACE_ORDER",
  order: makeOrder({
    userId: "alice",
    orderId: "ord_1",
    side: "LONG",
    type: "LIMIT",
    price: 50_000n,
    quantity: 4n,
    leverage: 2n,
  }),
  timestamp: Date.now(),
});

ex.dispatch({
  id: "c4",
  type: "PLACE_ORDER",
  order: makeOrder({
    userId: "bob",
    orderId: "ord_2",
    side: "SHORT",
    type: "MARKET",
    quantity: 2n,
    leverage: 2n,
  }),
  timestamp: Date.now(),
});

// Now inject a corrupted, partially written line at the tail of the WAL file
fs.appendFileSync(WAL_PATH, '{"id":"broken_tail","type":"DEPO\n');

const recoveryExchange = new Exchange();
recoveryExchange.createMarket("BTC-PERP");

const replayedCount = WriteAheadLog.replay(WAL_PATH, recoveryExchange);
check("F7: Successfully replayed all 4 intact commands despite corrupt tail", replayedCount, 4);

check("Alice available balance preserved", recoveryExchange.ledger.usersCollateral.get("alice")?.availableBalance, 900_000n);
check("Alice locked margin preserved", recoveryExchange.ledger.usersCollateral.get("alice")?.marginLocked, 100_000n);
check("Bob position preserved", recoveryExchange.ledger.getPosition("bob", "BTC-PERP")?.quantity, 2n);

console.log("\nReconciliation Check");
const recon = reconcileLedger(recoveryExchange, 2_000_000n);
check("Reconciliation: system is balanced", recon.isBalanced, true);
check("Reconciliation: zero drift", recon.drift, 0n);

if (fs.existsSync(WAL_PATH)) {
  fs.unlinkSync(WAL_PATH);
}

console.log(`\n${failures === 0 ? "F7 and reconciliation checks passed" : `${failures} check(s) failed`}\n`);
process.exit(failures === 0 ? 0 : 1);
