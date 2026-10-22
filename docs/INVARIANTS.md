# Invariants

Properties that must always hold. Each one gets a test at GOOD and a failure experiment at BETTER.
Status: `untested` · `tested` (unit test exists) · `stressed` (holds under load/failure, see `FAILURES.md`).

## Matching engine
| # | Invariant | Status |
| :-- | :-- | :-- |
| M1 | An order never executes more quantity than it has remaining | tested (`test.invariants.ts`) |
| M2 | Matching is deterministic: same command sequence gives identical fills and state | tested (`test.invariants.ts`) |
| M3 | Price-time priority holds: better price first, then earlier arrival | tested (`test.invariants.ts`) |
| M4 | A book never rests crossed (best bid < best ask) | tested (`test.invariants.ts`) |
| M5 | Matching loop is fully synchronous; no `await` between read and mutate | tested (by design) |

## Ledger / money
| # | Invariant | Status |
| :-- | :-- | :-- |
| L1 | No balance (available or locked) is ever negative | tested (`test.engine.ts`, `test.invariants.ts`) |
| L2 | `deposits == available + locked + insurance + fees` at all times | tested (`test.invariants.ts`) |
| L3 | Long and short funding payments net to zero | tested (`test.invariants.ts`) |
| L4 | Every fill changes both sides by equal and opposite quantity | tested (`test.invariants.ts`) |
| L5 | Money and size math is integer-only (`bigint`); no `number` | tested |

## Risk
| # | Invariant | Status |
| :-- | :-- | :-- |
| R1 | Liquidation decisions use mark/index price, never our own last traded price | tested (`test.scam-wick.ts`) |
| R2 | A position is liquidated iff `equity <= maintenanceMargin` | tested (`test.invariants.ts`) |
| R3 | A partial liquidation fill shrinks the position; it never vanishes | tested (`test.engine.ts`) |
| R4 | Liquidation settles from actual close fills | tested (`test.engine.ts`, `test.invariants.ts`) |

## Recovery (from BETTER)
| # | Invariant | Status |
| :-- | :-- | :-- |
| D1 | Replaying the WAL from a snapshot produces byte-identical state | tested (`test.wal.ts`) |
| D2 | A command delivered twice is applied once (idempotency key) | tested (`test.wal.ts`) |
| D3 | No accepted command is lost after `kill -9` | tested (`test.wal.ts`) |
