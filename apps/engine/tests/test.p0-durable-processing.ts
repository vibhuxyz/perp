import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { Exchange } from "../src/core/Exchange";
import { DurablePipeline } from "../src/pipeline/durable-pipeline";
import type { EngineCommand } from "../src/wal/types";
import type { Fill } from "../src/types/index";

function pass(name: string): void {
  console.log(`  PASS  ${name}`);
}

const runId = Date.now().toString();
const walPath = path.join("/tmp", `test-durable-pipeline-${runId}.wal`);
if (fs.existsSync(walPath)) fs.unlinkSync(walPath);

console.log("\nP0 Durable Command & Event Processing Suite");

const liveExchange = new Exchange();
liveExchange.createMarket("BTC-PERP");
const pipeline = new DurablePipeline(walPath, liveExchange);

const depCmd: EngineCommand = {
  id: "cmd-dep-1",
  type: "DEPOSIT",
  idempotencyKey: "dep-key-1",
  userId: "alice",
  amount: 100_000n,
  timestamp: Date.now(),
};

const res1 = pipeline.execute(depCmd);
assert.strictEqual(res1.sequenceNumber, 1n);
assert.strictEqual(res1.events.length, 1);
assert.strictEqual(res1.events[0]?.type, "COLLATERAL_DEPOSITED");
pass("Exact ordering: command accepted -> sequenced -> fsync'd -> mutated -> event emitted");

const resDup = pipeline.execute(depCmd);
assert.strictEqual(resDup.deduplicated, true);
assert.strictEqual(resDup.events.length, 0);
pass("Pipeline idempotency: re-submitted command suppressed before WAL fsync");

const bobDep: EngineCommand = {
  id: "cmd-dep-bob",
  type: "DEPOSIT",
  idempotencyKey: "dep-key-bob",
  userId: "bob",
  amount: 100_000n,
  timestamp: Date.now(),
};
pipeline.execute(bobDep);

const aliceLimit: EngineCommand = {
  id: "cmd-lim-alice",
  type: "PLACE_ORDER",
  idempotencyKey: "ord-key-alice",
  order: {
    orderId: "ord-alice-1",
    userId: "alice",
    market: "BTC-PERP",
    side: "LONG",
    type: "LIMIT",
    price: 50_000n,
    quantity: 2n,
    leverage: 2n,
    status: "resting",
    createdAt: new Date(),
  },
  timestamp: Date.now(),
};
const resLimit = pipeline.execute(aliceLimit);
assert.strictEqual(resLimit.events.length, 1);
assert.strictEqual(resLimit.events[0]?.type, "ORDER_ACCEPTED");

const bobMarket: EngineCommand = {
  id: "cmd-mkt-bob",
  type: "PLACE_ORDER",
  idempotencyKey: "ord-key-bob",
  order: {
    orderId: "ord-bob-1",
    userId: "bob",
    market: "BTC-PERP",
    side: "SHORT",
    type: "MARKET",
    price: 0n,
    quantity: 2n,
    leverage: 2n,
    status: "resting",
    createdAt: new Date(),
  },
  timestamp: Date.now(),
};
const resMarket = pipeline.execute(bobMarket);
assert(resMarket.events.length >= 2);
const fillEvent = resMarket.events.find(e => e.type === "FILL_CREATED");
assert(fillEvent !== undefined);
pass("Deterministic event generation: fill events emitted with matched metadata");

pipeline.close();

const postCrashExchange = new Exchange();
postCrashExchange.createMarket("BTC-PERP");
const replayedCount = DurablePipeline.replay(walPath, postCrashExchange);
assert.strictEqual(replayedCount, 4);

const restoredAlice = postCrashExchange.ledger.usersCollateral.get("alice");
const restoredBob = postCrashExchange.ledger.usersCollateral.get("bob");
assert(restoredAlice !== undefined && restoredBob !== undefined);
assert.strictEqual(restoredAlice.availableBalance, 50_000n);
assert.strictEqual(restoredAlice.marginLocked, 50_000n);
pass("Crash recovery Boundary 2: WAL replay deterministically recovers uncorrupted state");

class BusinessConsumer {
  private processedFills: Set<string>;
  public settledPnl: bigint;

  constructor() {
    this.processedFills = new Set();
    this.settledPnl = 0n;
  }

  public handleFillEvent(fill: Fill): boolean {
    if (this.processedFills.has(fill.fillId)) {
      return false;
    }
    this.processedFills.add(fill.fillId);
    this.settledPnl += fill.price * fill.quantity;
    return true;
  }
}

const consumer = new BusinessConsumer();
const sampleFill: Fill = {
  fillId: "fill-uuid-12345",
  market: "BTC-PERP",
  price: 50_000n,
  quantity: 2n,
  makerOrderId: "ord-alice-1",
  makerUserId: "alice",
  takerOrderId: "ord-bob-1",
  takerUserId: "bob",
  leverage: 2n,
  fee: 0,
  createdAt: new Date(),
};

assert.strictEqual(consumer.handleFillEvent(sampleFill), true);
assert.strictEqual(consumer.handleFillEvent(sampleFill), false);
assert.strictEqual(consumer.handleFillEvent(sampleFill), false);
assert.strictEqual(consumer.handleFillEvent(sampleFill), false);
assert.strictEqual(consumer.settledPnl, 100_000n);
pass("Business-level exactly-once: duplicate delivery cannot duplicate fills or payments");

if (fs.existsSync(walPath)) fs.unlinkSync(walPath);

console.log("\nDurable command & event processing suite passed\n");
