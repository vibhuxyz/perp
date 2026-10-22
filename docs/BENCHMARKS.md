# Benchmarks

Numbers only. No invented values. Every optimisation follows the same record:

```text
Problem:      Why it is slow:
Evidence:     Profiler / benchmark:
Hypothesis:   Why this should help:
Change:       What was modified:
Result:       Before -> After
Trade-off:    What became worse / more complex:
```

Record per run: throughput, p50, p95, p99, CPU, memory, machine, commit SHA, load level
(1x, 2x, 5x, 10x, 50x, 100x).

## Baselines (V0 naive design)
| Date | Commit | Scenario | Ops/sec | p50 | p95 | p99 | Notes |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| — | — | Match limit orders, array-sorted book | not run | | | | first entry due at AWESOME |

## Engineering questions to answer
* How many orders/sec can one market match, and where is the latency bottleneck?
* Does the per-order array sort dominate? (Profile before touching the data structure.)
* Do concurrent index price updates race with order flow in the margin check?
* What is p99 order latency at 1x, 10x, 100x order rate?

## Alternative designs to compare (at AWESOME)
| Component | A | B | C |
| :-- | :-- | :-- | :-- |
| Price levels | Sorted array (current) | Red-black tree | Sorted price-key array + Map of levels |
