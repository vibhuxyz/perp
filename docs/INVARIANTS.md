# Invariants

Properties that must always hold. Each one gets a test at GOOD and a failure experiment at BETTER/AWESOME.
Status: `untested` · `tested` (unit test exists) · `stressed` (holds under load/failure, see `FAILURES.md`).

## Matching engine
| # | Invariant | Status |
| :-- | :-- | :-- |
| M1 | An order never executes more quantity than it has remaining | stressed (`test.invariants.ts`, `test.f6-pathological-sweep.ts`) |
| M2 | Matching is deterministic: same command sequence gives identical fills and state | tested (`test.invariants.ts`) |
| M3 | Price-time priority holds: better price first, then earlier arrival | stressed (`test.invariants.ts`, `test.f6-pathological-sweep.ts`) |
| M4 | A book never rests crossed (best bid < best ask) | stressed (`test.invariants.ts`, `test.f6-pathological-sweep.ts`) |
| M5 | Matching loop is fully synchronous; no `await` between read and mutate | tested (by design) |

## Ledger / money
| # | Invariant | Status |
| :-- | :-- | :-- |
| L1 | No balance (available or locked) is ever negative | stressed (`test.engine.ts`, `test.invariants.ts`, `test.f3-concurrent-race.ts`, `test.property-conservation.ts`) |
| L2 | `deposits == available + locked + insurance + fees` at all times | stressed (`test.invariants.ts`, `test.wal-corrupt-tail.ts`, `test.property-conservation.ts`) |
| L3 | Long and short funding payments net to zero | stressed (`test.invariants.ts`, `test.property-conservation.ts`) |
| L4 | Every fill changes both sides by equal and opposite quantity | stressed (`test.invariants.ts`, `test.f6-pathological-sweep.ts`, `test.property-conservation.ts`) |
| L5 | Money and size math is integer-only (`bigint`); no `number` | tested |

## Risk
| # | Invariant | Status |
| :-- | :-- | :-- |
| R1 | Liquidation decisions use mark/index price, never our own last traded price | stressed (`test.scam-wick.ts`, `test.f3-concurrent-race.ts`) |
| R2 | A position is liquidated iff `equity <= maintenanceMargin` | stressed (`test.invariants.ts`, `test.f3-concurrent-race.ts`) |
| R3 | A partial liquidation fill shrinks the position; it never vanishes | tested (`test.engine.ts`) |
| R4 | Liquidation settles from actual close fills | tested (`test.engine.ts`, `test.invariants.ts`, `test.property-conservation.ts`) |
| R5 | Pre-trade risk checks are strictly fail-closed before book insertion | stressed (`test.p0-balance-correctness.ts`) |

## Recovery (from BETTER)
| # | Invariant | Status |
| :-- | :-- | :-- |
| D1 | Replaying the WAL from a snapshot produces byte-identical state | stressed (`test.wal.ts`, `test.wal-corrupt-tail.ts`, `test.snapshot-replay.ts`, `test.disaster-recovery.ts`) |
| D2 | A command delivered twice is applied once (idempotency key) | stressed (`test.wal.ts`, `test.deposit-withdrawal-safety.ts`, `test.p0-durable-processing.ts`) |
| D3 | No accepted command is lost after `kill -9` | stressed (`test.wal.ts`, `test.disaster-recovery.ts`) |
| D4 | Strict 4-phase pipeline (acceptance -> fsync -> mutation -> emission) guarantees durability before state change | stressed (`test.p0-durable-processing.ts`) |
| D5 | Monotonic fencing tokens prevent split-brain dual-primary writes on failover | stressed (`test.p0-single-writer-fencing.ts`) |
