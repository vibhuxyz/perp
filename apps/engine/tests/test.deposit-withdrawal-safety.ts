import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { Exchange } from "../src/core/Exchange";
import { WriteAheadLog } from "../src/wal/wal";
import type { EngineCommand } from "../src/wal/types";

function pass(name: string): void {
  console.log(`  PASS  ${name}`);
}

const walPath = path.join("/tmp", `test-deposit-withdrawal-${Date.now().toString()}.wal`);
if (fs.existsSync(walPath)) {
  fs.unlinkSync(walPath);
}

const wal = new WriteAheadLog(walPath);
const exchange = new Exchange(wal);

console.log("\nP0 Deposit & Withdrawal Safety Suite");

const depositCmd: EngineCommand = {
  id: "cmd-dep-1",
  type: "DEPOSIT",
  idempotencyKey: "dep-key-100",
  userId: "trader_alice",
  amount: 100_000n,
  timestamp: Date.now(),
};

exchange.dispatch(depositCmd);
exchange.dispatch(depositCmd);
exchange.dispatch(depositCmd);
exchange.dispatch(depositCmd);

const aliceCollateral = exchange.ledger.usersCollateral.get("trader_alice");
assert(aliceCollateral !== undefined);
assert.strictEqual(aliceCollateral.availableBalance, 100_000n);
assert.strictEqual(aliceCollateral.marginLocked, 0n);
pass("Deposit idempotency: 4 repeated callbacks credit account exactly once");

const withdrawCmd1: EngineCommand = {
  id: "cmd-wd-1",
  type: "WITHDRAW",
  idempotencyKey: "wd-key-200",
  userId: "trader_alice",
  amount: 40_000n,
  timestamp: Date.now(),
};

const wdResult1 = exchange.dispatch(withdrawCmd1);
assert.strictEqual(wdResult1, true);
assert.strictEqual(aliceCollateral.availableBalance, 60_000n);

const wdRetry1 = exchange.dispatch(withdrawCmd1);
const wdRetry2 = exchange.dispatch(withdrawCmd1);
assert.strictEqual(wdRetry1, null);
assert.strictEqual(wdRetry2, null);
assert.strictEqual(aliceCollateral.availableBalance, 60_000n);
pass("Withdrawal idempotency: timeout retries do not duplicate debits");

const overdrawCmd: EngineCommand = {
  id: "cmd-wd-overdraw",
  type: "WITHDRAW",
  idempotencyKey: "wd-key-overdraw",
  userId: "trader_alice",
  amount: 90_000n,
  timestamp: Date.now(),
};

const overdrawResult = exchange.dispatch(overdrawCmd);
assert.strictEqual(overdrawResult, false);
assert.strictEqual(aliceCollateral.availableBalance, 60_000n);
assert.strictEqual(aliceCollateral.marginLocked, 0n);
pass("Withdrawal safety: overdraft rejected without altering balance");

const withdrawCmd2: EngineCommand = {
  id: "cmd-wd-2",
  type: "WITHDRAW",
  idempotencyKey: "wd-key-201",
  userId: "trader_alice",
  amount: 60_000n,
  timestamp: Date.now(),
};

const wdResult2 = exchange.dispatch(withdrawCmd2);
assert.strictEqual(wdResult2, true);
assert.strictEqual(aliceCollateral.availableBalance, 0n);
pass("Valid full withdrawal reduces available balance to zero");

const emptyWithdrawalCmd: EngineCommand = {
  id: "cmd-wd-empty",
  type: "WITHDRAW",
  idempotencyKey: "wd-key-empty",
  userId: "trader_alice",
  amount: 1n,
  timestamp: Date.now(),
};

const emptyResult = exchange.dispatch(emptyWithdrawalCmd);
assert.strictEqual(emptyResult, false);
assert.strictEqual(aliceCollateral.availableBalance, 0n);
pass("Withdrawal on zero available balance cleanly rejected");

const bobDeposit: EngineCommand = {
  id: "cmd-dep-bob",
  type: "DEPOSIT",
  idempotencyKey: "dep-key-bob",
  userId: "trader_bob",
  amount: 50_000n,
  timestamp: Date.now(),
};
exchange.dispatch(bobDeposit);

const restoredExchange = new Exchange();
const replayedCount = WriteAheadLog.replay(walPath, restoredExchange);
assert.strictEqual(replayedCount, 6);

const restoredAlice = restoredExchange.ledger.usersCollateral.get("trader_alice");
const restoredBob = restoredExchange.ledger.usersCollateral.get("trader_bob");
assert(restoredAlice !== undefined);
assert(restoredBob !== undefined);
assert.strictEqual(restoredAlice.availableBalance, 0n);
assert.strictEqual(restoredBob.availableBalance, 50_000n);
pass("WAL replay deterministically restores exact post-withdrawal balances");

const replayBobDeposit = restoredExchange.dispatch(bobDeposit);
assert.strictEqual(replayBobDeposit, null);
assert.strictEqual(restoredBob.availableBalance, 50_000n);
pass("Post-restart idempotency: applied keys prevent replayed callback duplication");

if (fs.existsSync(walPath)) {
  fs.unlinkSync(walPath);
}

console.log("\nDeposit and withdrawal safety checks passed\n");
