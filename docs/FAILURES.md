# Failure Experiments

Break it on purpose, measure recovery, write down the result.

```text
Experiment:   Injected fault:
Expected:     Observed:
Detection time:   Recovery time:   Lost work:   Duplicate work:   Corrupt state:
Invariants checked:
Fix / follow-up:
```

## Planned
| ID | Fault | Rung | Invariants | Status |
| :-- | :-- | :-- | :-- | :-- |
| F1 | `kill -9` engine mid-trading, restart, load snapshot, replay WAL, compare state | BETTER | D1, D3, L2 | passed (`test.wal.ts`) |
| F2 | Deliver every order/fill event twice | BETTER | D2, L2 | passed (`test.wal.ts`) |
| F3 | Index price updates hammered concurrently with order flow | AWESOME | R1, R2, L1 | passed (`test.f3-concurrent-race.ts`) |
| F4 | Scam wick on the local book while index is stable | GOOD | R1 | passed (`test.scam-wick.ts`) |
| F5 | Price gaps past bankruptcy price with an empty insurance fund | BEST | L1, L2 | passed (`test.f5-gap-adl.ts`) |
| F6 | Pathological book: 10K+ resting orders, one market order sweeps all | AWESOME | M1, M4, L4 | passed (`test.f6-pathological-sweep.ts`) |
| F7 | Corrupt / truncated last WAL record on boot | BETTER | D1 | passed (`test.wal-corrupt-tail.ts`) |
| F8 | Deposit/withdrawal replay callbacks and network timeouts | BETTER | D2, L1, L2 | passed (`test.deposit-withdrawal-safety.ts`) |
| F9 | Snapshot restore + tail WAL replay state equivalence | BETTER | D1 | passed (`test.snapshot-replay.ts`) |
| F10 | Clean-room disaster recovery and data loss verification | BEST | D1, D3, L2 | passed (`test.disaster-recovery.ts`) |
| F11 | Property-based ledger conservation under 500 interleaved ops | AWESOME | L1, L2, L4 | passed (`test.property-conservation.ts`) |
| F12 | Pre-trade risk validation fail-closed and terminal state checks | GOOD | R5, L1 | passed (`test.p0-balance-correctness.ts`) |
| F13 | Boundary crash recovery and business-level event deduplication | BETTER | D4, D2 | passed (`test.p0-durable-processing.ts`) |
| F14 | Split-brain zombie writer hard-rejection via fencing tokens | BETTER | D5 | passed (`test.p0-single-writer-fencing.ts`) |

## Results

### F4: Scam Wick on Local Book While Index Is Stable
- **Experiment:** Malicious trader dumps local book from $50,000 to $1,000 (98% drop) while external index price stays at $50,000.
- **Expected:** Invariant R1 holds — risk engine evaluates equity strictly against index/mark price, completely ignoring local book wicks.
- **Observed:** Alice's LONG position remained completely untouched. Alice was only liquidated when the external index price itself dropped below maintenance margin ($44,000).
- **Invariants checked:** R1, R2.
- **Script:** `apps/engine/tests/test.scam-wick.ts`.

### F1: Crash Replay from WAL
- **Experiment:** Engine writes commands to append-only WAL. Crash simulated by creating a fresh uninitialized Exchange instance and running boot replay.
- **Expected:** Invariants D1 and D3 hold — all balances, margin, positions, and resting orders match byte-identically with the pre-crash live instance.
- **Observed:** Full state reconstructed with zero lost work across 5 commands.
- **Invariants checked:** D1, D3.
- **Script:** `apps/engine/tests/test.wal.ts`.

### F2: Duplicate Delivery (Idempotency)
- **Experiment:** Deposit command submitted twice with the same `idempotencyKey`.
- **Expected:** Invariant D2 holds — balance credited exactly once.
- **Observed:** Second command was caught and suppressed; available balance remained exact.
- **Invariants checked:** D2.
- **Script:** `apps/engine/tests/test.wal.ts`.

### F7: Corrupted / Truncated WAL Tail on Boot
- **Experiment:** Power failure simulated mid-write by injecting half a JSON record at the end of the WAL file.
- **Expected:** Boot replay recovers all intact preceding commands and cleanly ignores the corrupt tail without throwing.
- **Observed:** All 4 valid preceding commands replayed with zero data corruption. Ledger reconciled to zero drift.
- **Invariants checked:** D1.
- **Script:** `apps/engine/tests/test.wal-corrupt-tail.ts`.

### F6: Pathological Book Sweep (10,000 Resting Orders Swept)
- **Experiment:** 10,000 distinct price levels populated on ask side ($50,001 to $60,000) with 1 unit each. A single market order sweeps the entire book.
- **Expected:** Invariants M1 (no overfill), M3 (strict price priority), M4 (no crossed book), and L4 (conservation of quantity) hold. Sweep executes completely without stack overflow or corrupted levels.
- **Observed:** Swept 10,000 orders in 3.42 ms (~2,920,000 fills/sec). All 10,000 fills matched in strictly ascending price order. Taker quantity reduced to 0. Asks book drained to 0. Bids book remained 0.
- **Invariants checked:** M1, M3, M4, L4.
- **Script:** `apps/engine/tests/test.f6-pathological-sweep.ts`.

### F3: Concurrent Price Hammering vs Order Flow
- **Experiment:** 20 leveraged traders with open positions hammered by 12 rapid external index price swings ($57,000 down to $43,000 and back to $50,000) while actively placing market and limit orders and triggering liquidations.
- **Expected:** Invariants R1, R2, and L1 hold. Safe positions are not liquidated when equity > MMR; breaching positions are closed; no negative balances or negative locked margins occur under interleaved operations.
- **Observed:** Zero negative balances and zero negative locked margins across all 20 traders and LP. Safe positions held until index dropped past maintenance margin, after which liquidations executed cleanly against resting liquidity.
- **Invariants checked:** R1, R2, L1.
- **Script:** `apps/engine/tests/test.f3-concurrent-race.ts`.

### F5: Price Gap Past Bankruptcy with Empty Insurance Fund
- **Experiment:** Trader Alice opens a leveraged LONG at $50,000 (bankruptcy price $45,000). Market price gaps down to $40,000 with an empty insurance fund (`insuranceFund = 0n`).
- **Expected:** Invariants L1 and L2 hold. Alice's available balance does not go negative. Auto-Deleveraging (ADL) automatically engages against the most profitable counterparty (Bob) at bankruptcy price, clearing the deficit and preserving systemic solvency.
- **Observed:** Alice's balance remained exactly 0n (clamped from negative deficit). The unabsorbed deficit triggered ADL against Bob, maintaining aggregate solvency without exchange bankruptcy.
- **Invariants checked:** L1, L2.
- **Script:** `apps/engine/tests/test.f5-gap-adl.ts`.

### F8: Deposit/Withdrawal Replay Callbacks and Network Timeouts
- **Experiment:** Redundant external payment gateway callbacks delivered 4x for deposit and 3x for withdrawal; timeout retries re-sent with identical idempotency keys; overdraft withdrawal attempted with insufficient funds.
- **Expected:** Invariants D2, L1, and L2 hold. Deposits credited exactly once; withdrawals debited exactly once; overdraft rejected without negative balance; WAL recovery reconstructs exact state.
- **Observed:** Duplicate callbacks suppressed via idempotency key tracking. Overdraw returned false. WAL replay restored exact zero-balance state. Post-restart duplicate callbacks suppressed.
- **Invariants checked:** D2, L1, L2.
- **Script:** `apps/engine/tests/test.deposit-withdrawal-safety.ts`.

### F9: Snapshot and Tail Replay Optimization
- **Experiment:** Engine executes 104 commands. Mid-stream state snapshot captured at sequence 40. Instance A performs full boot replay (0 to 104). Instance B performs snapshot restore + tail replay (41 to 104).
- **Expected:** Invariant D1 holds. Both instances produce the exact identical cryptographic state hash (SHA-256). Snapshot restore + tail replay reduces recovery duration.
- **Observed:** Full replay duration: 1.08 ms. Snapshot + tail replay duration: 0.58 ms (1.86x faster). Both instances converged to the identical SHA-256 state hash `b1521cb77807c3959b3aff2b96fb0942dcd8eea6bf3e0110afe130cc9ca96d3b`.
- **Invariants checked:** D1.
- **Script:** `apps/engine/tests/test.snapshot-replay.ts`.

### F10: Clean-Room Disaster Recovery & Zero Data Loss
- **Experiment:** Catastrophic primary node loss simulated. Standby clean environment initialized with zero memory state. Database backup and WAL snapshot + delta restored.
- **Expected:** Invariants D1, D3, L2 hold. Recovery Time Objective (RTO) measured empirically; Recovery Point Objective (RPO) = 0 transactions lost. Restored state matches primary SHA-256 hash byte-for-byte.
- **Observed:** RTO measured at 0.469 ms - 2.094 ms. RPO = 0 records lost across 55 committed transactions (20 tail entries replayed). Standby state hash matched primary state hash (`3b68293ede96537b50d5be05e236916bff09b76c7eb83a5d2fe21ce7cf3cd182`). Zero financial drift.
- **Invariants checked:** D1, D3, L2.
- **Script:** `apps/engine/tests/test.disaster-recovery.ts`.

### F11: Randomized Property-Based Ledger Conservation
- **Experiment:** Deterministic PRNG drives 500 interleaved transactions across maker/taker fees, partial fills, funding rate settlements, cancellations, liquidations, and bankruptcy deficit absorption.
- **Expected:** Invariants L1, L2, L4 strictly hold at every single step of the 500 transitions without rounding drift or phantom collateral.
- **Observed:** All 500 transitions maintained exact net deposit equality: `totalNetDeposits === available + locked + insuranceFund + feePool`. Total long open interest strictly equaled total short open interest (`L4`). Zero negative balances or margins (`L1`).
- **Invariants checked:** L1, L2, L4.
- **Script:** `apps/engine/tests/test.property-conservation.ts`.

### F12: Pre-Trade Risk Validation Fail-Closed & Terminal Order States
- **Experiment:** Submit orders with invalid parameters (zero/negative quantity, excessive 100x leverage, non-existent account, insufficient balance) and attempt to transition terminal order states (`FILLED` -> `CANCELLED`).
- **Expected:** Invariant R5 holds. Pre-trade risk checks fail closed; order is rejected before entering the order book; zero margin is locked; terminal state transitions throw an illegal transition error.
- **Observed:** All invalid orders were cleanly rejected; available balance remained intact; terminal state transition threw `Illegal order state transition from FILLED to CANCELLED`.
- **Invariants checked:** R5, L1.
- **Script:** `apps/engine/tests/test.p0-balance-correctness.ts`.

### F13: Pipeline Boundary Recovery & Business-Level Deduplication
- **Experiment:** Engine executes through 4-phase pipeline (`Acceptance` -> `fsync` -> `Mutation` -> `Publication`). Crashes simulated across boundaries; duplicated fill events delivered 5x to downstream consumer.
- **Expected:** Invariants D4 and D2 hold. Commands fsync'd before memory mutation; duplicate commands suppressed; downstream business consumers deduplicate fills and payments by unique ID.
- **Observed:** Exact sequence numbers assigned; fsync barrier verified on disk; duplicate fill delivery resulted in exactly 1 settlement (100,000 settled PnL, not 500,000).
- **Invariants checked:** D4, D2.
- **Script:** `apps/engine/tests/test.p0-durable-processing.ts`.

### F14: Split-Brain Zombie Writer Hard-Rejection via Fencing Tokens
- **Experiment:** Dual primary split-brain scenario. Primary Engine 1 pauses (GC / network partition). Coordinator promotes Standby Engine 2 with monotonic fencing token increment (1n -> 2n). Engine 1 wakes up and attempts a delayed write.
- **Expected:** Invariant D5 holds. Fenced storage barrier rejects Engine 1's write with `StaleFencingTokenError`. Engine 1 detects lease invalidation and self-terminates to prevent state corruption.
- **Observed:** Engine 2 took over with token 2n. Delayed write from Engine 1 was hard-rejected by `FencedStore`. Engine 1 transitioned to terminated zombie mode. State remained 100% uncorrupted.
- **Invariants checked:** D5.
- **Script:** `apps/engine/tests/test.p0-single-writer-fencing.ts`.
