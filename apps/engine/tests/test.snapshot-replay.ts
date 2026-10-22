import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { Exchange } from "../src/core/Exchange";
import { WriteAheadLog } from "../src/wal/wal";
import { createSnapshot, restoreSnapshot, computeStateHash } from "../src/wal/snapshot";
import type { EngineCommand } from "../src/wal/types";

function pass(name: string): void {
  console.log(`  PASS  ${name}`);
}

const runId = Date.now().toString();
const walPath = path.join("/tmp", `test-snapshot-stream-${runId}.wal`);
const snapshotPath = path.join("/tmp", `test-snapshot-file-${runId}.json`);

if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
if (fs.existsSync(snapshotPath)) fs.unlinkSync(snapshotPath);

console.log("\nP1 Snapshot & Replay Optimization Suite");

const wal = new WriteAheadLog(walPath);
const liveExchange = new Exchange(wal);
liveExchange.createMarket("BTC-PERP");

const users = ["trader_one", "trader_two", "trader_three", "trader_four"];
for (const u of users) {
  liveExchange.dispatch({
    id: `cmd-dep-${u}`,
    type: "DEPOSIT",
    idempotencyKey: `dep-${u}`,
    userId: u,
    amount: 1_000_000n,
    timestamp: Date.now(),
  });
}

const SNAPSHOT_INDEX = 40;
const TOTAL_COMMANDS = 100;
let snapshotData: ReturnType<typeof createSnapshot> | null = null;

for (let i = 1; i <= TOTAL_COMMANDS; i++) {
  const mod = i % 4;
  const user = users[mod] ?? "trader_one";
  let cmd: EngineCommand;

  if (i % 7 === 0) {
    cmd = {
      id: `cmd-wd-${i}`,
      type: "WITHDRAW",
      idempotencyKey: `wd-key-${i}`,
      userId: user,
      amount: 5_000n,
      timestamp: Date.now(),
    };
  } else if (i % 5 === 0) {
    cmd = {
      id: `cmd-mkt-${i}`,
      type: "PLACE_ORDER",
      idempotencyKey: `mkt-key-${i}`,
      order: {
        orderId: `ord-mkt-${i}`,
        userId: user,
        market: "BTC-PERP",
        side: i % 2 === 0 ? "LONG" : "SHORT",
        type: "MARKET",
        price: 0n,
        quantity: 1n,
        leverage: 2n,
        status: "resting",
        createdAt: new Date(),
      },
      timestamp: Date.now(),
    };
  } else {
    cmd = {
      id: `cmd-lim-${i}`,
      type: "PLACE_ORDER",
      idempotencyKey: `lim-key-${i}`,
      order: {
        orderId: `ord-lim-${i}`,
        userId: user,
        market: "BTC-PERP",
        side: i % 2 === 0 ? "LONG" : "SHORT",
        type: "LIMIT",
        price: 50_000n + BigInt((i % 10) * 10),
        quantity: 2n,
        leverage: 2n,
        status: "resting",
        createdAt: new Date(),
      },
      timestamp: Date.now(),
    };
  }

  liveExchange.dispatch(cmd);

  if (i === SNAPSHOT_INDEX) {
    snapshotData = createSnapshot(liveExchange, BigInt(i));
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshotData));
  }
}

assert(snapshotData !== null);
const liveHash = computeStateHash(liveExchange);

const fullStart = performance.now();
const instanceA = new Exchange();
const fullCount = WriteAheadLog.replay(walPath, instanceA);
const fullDuration = performance.now() - fullStart;

assert.strictEqual(fullCount, TOTAL_COMMANDS + users.length);
const fullReplayHash = computeStateHash(instanceA);
assert.strictEqual(fullReplayHash, liveHash);
pass("Instance A: Full replay from sequence 0 reproduces live state hash byte-for-byte");

const snapStart = performance.now();
const instanceB = new Exchange();
const rawSnapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf-8"));
restoreSnapshot(rawSnapshot, instanceB);
const tailCount = WriteAheadLog.replay(walPath, instanceB, users.length + SNAPSHOT_INDEX);
const snapDuration = performance.now() - snapStart;

assert.strictEqual(tailCount, TOTAL_COMMANDS - SNAPSHOT_INDEX);
const snapshotReplayHash = computeStateHash(instanceB);

assert.strictEqual(snapshotReplayHash, liveHash);
assert.strictEqual(snapshotReplayHash, fullReplayHash);
pass("Instance B: Snapshot + tail replay yields byte-identical SHA-256 state hash");

for (const u of users) {
  const colA = instanceA.ledger.usersCollateral.get(u);
  const colB = instanceB.ledger.usersCollateral.get(u);
  assert(colA !== undefined && colB !== undefined);
  assert.strictEqual(colA.availableBalance, colB.availableBalance);
  assert.strictEqual(colA.marginLocked, colB.marginLocked);
}
pass("Account balances match identically between full replay and snapshot restore");

console.log(`\n  Benchmark Metrics:`);
console.log(`    Full Replay Duration:     ${fullDuration.toFixed(2)} ms (${fullCount} entries)`);
console.log(`    Snapshot+Tail Duration:   ${snapDuration.toFixed(2)} ms (${tailCount} tail entries)`);
console.log(`    State Hash (SHA-256):     ${liveHash}`);

if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
if (fs.existsSync(snapshotPath)) fs.unlinkSync(snapshotPath);

console.log("\nSnapshot and replay optimization tests passed\n");
