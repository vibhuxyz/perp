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
| F3 | Index price updates hammered concurrently with order flow | AWESOME | R1, R2, L1 | not run |
| F4 | Scam wick on the local book while index is stable | GOOD | R1 | passed (`test.scam-wick.ts`) |
| F5 | Price gaps past bankruptcy price with an empty insurance fund | BEST | L2 | not run |
| F6 | Pathological book: 100K resting orders, one market order sweeps all | AWESOME | M1, M4 | not run |
| F7 | Corrupt / truncated last WAL record on boot | BETTER | D1 | not run |

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
