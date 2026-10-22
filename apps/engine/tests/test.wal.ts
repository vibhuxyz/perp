import fs from "fs";
import { Exchange } from "../src/core/Exchange";
import { WriteAheadLog } from "../src/wal/wal";
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

const WAL_PATH = `/tmp/test-engine-wal-${Date.now()}.log`;
if (fs.existsSync(WAL_PATH)) {
  fs.unlinkSync(WAL_PATH);
}

console.log("\nRung 3 (BETTER): WAL, Replay & Idempotency");

const wal = new WriteAheadLog(WAL_PATH);
const liveExchange = new Exchange(wal);
liveExchange.createMarket("BTC-PERP");

liveExchange.dispatch({
  id: "cmd1",
  type: "DEPOSIT",
  idempotencyKey: "idem_dep_1",
  userId: "alice",
  amount: 2_000_000n,
  timestamp: Date.now(),
});

liveExchange.dispatch({
  id: "cmd1_dup",
  type: "DEPOSIT",
  idempotencyKey: "idem_dep_1",
  userId: "alice",
  amount: 2_000_000n,
  timestamp: Date.now(),
});

check("D2: Duplicate deposit with same idempotency key is ignored", liveExchange.ledger.usersCollateral.get("alice")?.availableBalance, 2_000_000n);

liveExchange.dispatch({
  id: "cmd2",
  type: "DEPOSIT",
  userId: "bob",
  amount: 2_000_000n,
  timestamp: Date.now(),
});

liveExchange.dispatch({
  id: "cmd3",
  type: "PLACE_ORDER",
  order: makeOrder({
    userId: "alice",
    orderId: "ord_a",
    side: "LONG",
    type: "LIMIT",
    price: 50_000n,
    quantity: 10n,
    leverage: 2n,
  }),
  timestamp: Date.now(),
});

liveExchange.dispatch({
  id: "cmd4",
  type: "PLACE_ORDER",
  order: makeOrder({
    userId: "bob",
    orderId: "ord_b",
    side: "SHORT",
    type: "MARKET",
    quantity: 4n,
    leverage: 2n,
  }),
  timestamp: Date.now(),
});

liveExchange.dispatch({
  id: "cmd5",
  type: "CANCEL_ORDER",
  market: "BTC-PERP",
  userId: "alice",
  orderId: "ord_a",
  timestamp: Date.now(),
});

const liveAlice = liveExchange.ledger.usersCollateral.get("alice");
const liveBob = liveExchange.ledger.usersCollateral.get("bob");
const liveAlicePos = liveExchange.ledger.getPosition("alice", "BTC-PERP");
const liveBobPos = liveExchange.ledger.getPosition("bob", "BTC-PERP");

const crashedExchange = new Exchange();
crashedExchange.createMarket("BTC-PERP");

const replayedCount = WriteAheadLog.replay(WAL_PATH, crashedExchange);
check("D1/D3: Replayed all written commands from WAL", replayedCount, 5);

const replayedAlice = crashedExchange.ledger.usersCollateral.get("alice");
const replayedBob = crashedExchange.ledger.usersCollateral.get("bob");
const replayedAlicePos = crashedExchange.ledger.getPosition("alice", "BTC-PERP");
const replayedBobPos = crashedExchange.ledger.getPosition("bob", "BTC-PERP");

check("D1: Alice available balance matches exactly after restart", replayedAlice?.availableBalance, liveAlice?.availableBalance);
check("D1: Alice locked margin matches exactly after restart", replayedAlice?.marginLocked, liveAlice?.marginLocked);
check("D1: Bob available balance matches exactly after restart", replayedBob?.availableBalance, liveBob?.availableBalance);
check("D1: Bob locked margin matches exactly after restart", replayedBob?.marginLocked, liveBob?.marginLocked);
check("D1: Alice position quantity matches exactly after restart", replayedAlicePos?.quantity, liveAlicePos?.quantity);
check("D1: Bob position quantity matches exactly after restart", replayedBobPos?.quantity, liveBobPos?.quantity);
check("D1: Alice resting orders count matches after restart", crashedExchange.getRestingOrders("alice").length, liveExchange.getRestingOrders("alice").length);

if (fs.existsSync(WAL_PATH)) {
  fs.unlinkSync(WAL_PATH);
}

console.log(`\n${failures === 0 ? "WAL and replay tests passed" : `${failures} check(s) failed`}\n`);
process.exit(failures === 0 ? 0 : 1);
