import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { Exchange } from "../src/core/Exchange";
import { WriteAheadLog } from "../src/wal/wal";
import { createSnapshot, restoreSnapshot, computeStateHash } from "../src/wal/snapshot";

function pass(name: string): void {
  console.log(`  PASS  ${name}`);
}

const primaryDir = path.join("/tmp", `dr-primary-${Date.now().toString()}`);
const standbyDir = path.join("/tmp", `dr-standby-${Date.now().toString()}`);

fs.mkdirSync(path.join(primaryDir, "wal"), { recursive: true });
fs.mkdirSync(path.join(primaryDir, "backup"), { recursive: true });
fs.mkdirSync(path.join(standbyDir, "wal"), { recursive: true });
fs.mkdirSync(path.join(standbyDir, "backup"), { recursive: true });

const primaryWalPath = path.join(primaryDir, "wal", "engine.wal");
const primarySnapPath = path.join(primaryDir, "backup", "snapshot.json");
const primaryDbPath = path.join(primaryDir, "backup", "db_dump.json");

const wal = new WriteAheadLog(primaryWalPath);
const primaryExchange = new Exchange(wal);
primaryExchange.createMarket("BTC-PERP");

console.log("\nP1 Disaster Recovery: Clean-Room Restoration & Recovery Metrics");

const accounts = ["dr_user_1", "dr_user_2", "dr_user_3", "dr_user_4", "dr_user_5"];
let totalCommittedCommands = 0;

for (const acc of accounts) {
  primaryExchange.dispatch({
    id: `cmd-dep-${acc}`,
    type: "DEPOSIT",
    idempotencyKey: `dep-${acc}`,
    userId: acc,
    amount: 500_000n,
    timestamp: Date.now(),
  });
  totalCommittedCommands++;
}

for (let i = 1; i <= 30; i++) {
  const user = accounts[i % accounts.length] ?? "dr_user_1";
  primaryExchange.dispatch({
    id: `cmd-lim-${i}`,
    type: "PLACE_ORDER",
    idempotencyKey: `lim-${i}`,
    order: {
      orderId: `ord-dr-${i}`,
      userId: user,
      market: "BTC-PERP",
      side: i % 2 === 0 ? "LONG" : "SHORT",
      type: "LIMIT",
      price: 50_000n + BigInt(i * 10),
      quantity: 1n,
      leverage: 5n,
      status: "resting",
      createdAt: new Date(),
    },
    timestamp: Date.now(),
  });
  totalCommittedCommands++;
}

const snapshotSeq = BigInt(totalCommittedCommands);
const primarySnapshot = createSnapshot(primaryExchange, snapshotSeq);
fs.writeFileSync(primarySnapPath, JSON.stringify(primarySnapshot));

for (let i = 31; i <= 50; i++) {
  const user = accounts[i % accounts.length] ?? "dr_user_1";
  if (i % 3 === 0) {
    primaryExchange.dispatch({
      id: `cmd-mkt-${i}`,
      type: "PLACE_ORDER",
      idempotencyKey: `mkt-${i}`,
      order: {
        orderId: `ord-dr-${i}`,
        userId: user,
        market: "BTC-PERP",
        side: i % 2 === 0 ? "LONG" : "SHORT",
        type: "MARKET",
        price: 0n,
        quantity: 1n,
        leverage: 5n,
        status: "resting",
        createdAt: new Date(),
      },
      timestamp: Date.now(),
    });
  } else {
    primaryExchange.dispatch({
      id: `cmd-wd-${i}`,
      type: "WITHDRAW",
      idempotencyKey: `wd-${i}`,
      userId: user,
      amount: 1_000n,
      timestamp: Date.now(),
    });
  }
  totalCommittedCommands++;
}

const mockDatabaseDump = {
  schemaVersion: "1.0.0",
  tables: {
    users: accounts.map(id => ({ id, createdAt: new Date().toISOString() })),
    backupTimestamp: Date.now(),
  },
};
fs.writeFileSync(primaryDbPath, JSON.stringify(mockDatabaseDump));

const primaryStateHash = computeStateHash(primaryExchange);

const standbySnapPath = path.join(standbyDir, "backup", "snapshot.json");
const standbyWalPath = path.join(standbyDir, "wal", "engine.wal");
const standbyDbPath = path.join(standbyDir, "backup", "db_dump.json");

fs.copyFileSync(primarySnapPath, standbySnapPath);
fs.copyFileSync(primaryWalPath, standbyWalPath);
fs.copyFileSync(primaryDbPath, standbyDbPath);

const tRecoveryStart = process.hrtime.bigint();

const restoredDb = JSON.parse(fs.readFileSync(standbyDbPath, "utf-8"));
assert.strictEqual(restoredDb.tables.users.length, accounts.length);

const standbyExchange = new Exchange();
const rawSnapshot = JSON.parse(fs.readFileSync(standbySnapPath, "utf-8"));
restoreSnapshot(rawSnapshot, standbyExchange);

const tailReplayed = WriteAheadLog.replay(standbyWalPath, standbyExchange, Number(snapshotSeq));

const tRecoveryEnd = process.hrtime.bigint();
const rtoMs = Number(tRecoveryEnd - tRecoveryStart) / 1_000_000;

assert.strictEqual(tailReplayed, 20);
const standbyStateHash = computeStateHash(standbyExchange);

assert.strictEqual(standbyStateHash, primaryStateHash);
pass("Clean-Room Recovery: restored state hash byte-identical to primary (0 records lost)");

for (const acc of accounts) {
  const pCol = primaryExchange.ledger.usersCollateral.get(acc);
  const sCol = standbyExchange.ledger.usersCollateral.get(acc);
  assert(pCol !== undefined && sCol !== undefined);
  assert.strictEqual(sCol.availableBalance, pCol.availableBalance);
  assert.strictEqual(sCol.marginLocked, pCol.marginLocked);
}
pass("Balance verification: zero financial drift across all user accounts in clean standby");

console.log(`\n  Disaster Recovery Metrics (Empirical):`);
console.log(`    Recovery Time Objective (RTO):  ${rtoMs.toFixed(3)} ms`);
console.log(`    Recovery Point Objective (RPO): 0 transactions lost (100% durable)`);
console.log(`    Committed Transactions:         ${totalCommittedCommands.toString()}`);
console.log(`    Tail Delta Replayed:            ${tailReplayed.toString()} entries`);
console.log(`    Primary State Hash:             ${primaryStateHash}`);
console.log(`    Standby State Hash:             ${standbyStateHash}`);

fs.rmSync(primaryDir, { recursive: true, force: true });
fs.rmSync(standbyDir, { recursive: true, force: true });

console.log("\nDisaster recovery test suite passed\n");
