import assert from "node:assert";
import {
  LeaseCoordinator,
  FencedStore,
  SingleWriterEngine,
  StaleFencingTokenError,
} from "../src/fencing/index";
import type { EngineCommand } from "../src/wal/types";

function pass(name: string): void {
  console.log(`  PASS  ${name}`);
}

console.log("\nP0 Single-Writer Engine with Fencing Suite");

const coordinator = new LeaseCoordinator(500);
const store = new FencedStore();

const engine1 = new SingleWriterEngine("node_primary", "BTC-PERP", coordinator, store);
const engine2 = new SingleWriterEngine("node_standby", "BTC-PERP", coordinator, store);

const acquired1 = engine1.acquireOwnership();
assert.strictEqual(acquired1, true);
assert.strictEqual(engine1.getFencingToken(), 1n);

const acquired2 = engine2.acquireOwnership();
assert.strictEqual(acquired2, false);
pass("Single writer guarantee: only one active engine can acquire market lease");

const depCmd1: EngineCommand = {
  id: "cmd-fenced-dep-1",
  type: "DEPOSIT",
  idempotencyKey: "dep-fenced-1",
  userId: "alice",
  amount: 200_000n,
  timestamp: Date.now(),
};

engine1.dispatch(depCmd1);
const aliceCol = engine1.exchange.ledger.usersCollateral.get("alice");
assert(aliceCol !== undefined);
assert.strictEqual(aliceCol.availableBalance, 200_000n);
assert.strictEqual(store.getRecords("BTC-PERP").length, 1);
pass("Active writer successfully mutates state with valid fencing token");

const failoverLease = coordinator.failover("BTC-PERP", "node_standby");
assert.strictEqual(failoverLease.fencingToken, 2n);
assert.strictEqual(failoverLease.ownerNodeId, "node_standby");

engine2.acquireOwnership();
assert.strictEqual(engine2.getFencingToken(), 2n);

const depCmd2: EngineCommand = {
  id: "cmd-fenced-dep-2",
  type: "DEPOSIT",
  idempotencyKey: "dep-fenced-2",
  userId: "bob",
  amount: 150_000n,
  timestamp: Date.now(),
};

engine2.dispatch(depCmd2);
assert.strictEqual(store.getActiveToken("BTC-PERP"), 2n);
assert.strictEqual(store.getRecords("BTC-PERP").length, 2);
pass("Failover promotes standby with monotonic fencing token increment (1n -> 2n)");

const delayedZombieCmd: EngineCommand = {
  id: "cmd-zombie-dep",
  type: "DEPOSIT",
  idempotencyKey: "dep-zombie",
  userId: "alice",
  amount: 50_000n,
  timestamp: Date.now(),
};

assert.throws(() => {
  engine1.dispatch(delayedZombieCmd);
}, StaleFencingTokenError);

assert.strictEqual(engine1.isTerminated(), true);
pass("Fencing barrier: stale engine delayed write hard-rejected with StaleFencingTokenError");

assert.throws(() => {
  engine1.dispatch(delayedZombieCmd);
}, /not the active single writer/);
pass("Zombie engine self-terminates after fencing rejection to prevent split-brain");

const engineEth = new SingleWriterEngine("node_eth", "ETH-PERP", coordinator, store);
const acquiredEth = engineEth.acquireOwnership();
assert.strictEqual(acquiredEth, true);
assert.strictEqual(engineEth.market, "ETH-PERP");
pass("Market-keyed partitioning: independent markets operate with isolated writer ownership");

console.log("\nSingle-writer engine with fencing suite passed\n");
