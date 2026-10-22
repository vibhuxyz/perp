# Where the Matching Engine's Latency Goes

An empirical investigation into matching engine performance across the quality ladder from naive baseline (V0) to optimized durable execution (Rung 4: AWESOME).

---

## 1. Executive Summary

By following the engineering-first standard (measure before modifying, profile to prove bottlenecks, benchmark head-to-head before replacing), the matching engine achieved a **503x throughput increase** and a **561x reduction in p99 latency** on deep books:

- **V0 Naive (Sorted Map Keys):** 3,505 ops/sec at 50k price levels; p99 latency of 1.122 ms.
- **Upgraded (Sorted Keys + Map):** 1,763,523 ops/sec at 50k price levels; p99 latency of 0.002 ms (2 microseconds).
- **Continuous Flow Throughput:** 1,558,330 ops/sec; p50 < 0.001 ms, p99 = 0.002 ms.

---

## 2. Anatomy of Latency in V0 (Naive Baseline)

In V0, the matching loop in `apps/engine/src/core/orderbook.ts` processed an order using:

```ts
const availablePrices = sortPrices(Array.from(opposingBook.keys()));
```

Every incoming order triggered:
1. `opposingBook.keys()` iterator allocation.
2. `Array.from()` creating a new array containing all $N$ distinct price ticks.
3. JavaScript array sort allocating a comparator closure and executing $O(N \log N)$ comparisons.
4. Linear iteration across `availablePrices` even when the top of the book was uncrossed.

### Profiler Breakdown (`profiling/profile.ts`)
Using Node `perf_hooks` and nanosecond timing over 20,000 orders:
- **Total Duration:** 480.73 ms
- **Key Sorting Time:** 241.91 ms (**50.32% of entire runtime**)
- **Matching & Fills:** 238.82 ms (49.68%)

The profiler proved empirically that per-order key sorting consumed more than half of the entire execution budget.

---

## 3. Alternative Designs Compared

| Metric | Design A: Naive Sort | Design B: Sorted Keys + Map | Design C: Red-Black Tree |
| :--- | :--- | :--- | :--- |
| **Best Price Lookup** | $O(N \log N)$ | $O(1)$ (`sortedPrices[0]`) | $O(1)$ (`min()` node) |
| **New Price Insertion** | $O(1)$ into Map | $O(\log N)$ binary insert | $O(\log N)$ tree insert |
| **Existing Price Order** | $O(1)$ into array | $O(1)$ into Map | $O(1)$ at tree node |
| **Key Iteration** | $O(N \log N)$ | $O(K)$ crossed levels only | $O(K)$ in-order traversal |
| **V8 Memory Overhead** | High (transient GC) | Minimal (contiguous array) | Higher (node pointers) |
| **Throughput (20k orders)**| 4,775 ops/sec | **1,942,627 ops/sec** | ~800,000 ops/sec |
| **Speedup** | Baseline (1.0x) | **406.8x** | ~167x |

### Why Design B Wins in TypeScript / V8
In V8, flat contiguous typed/bigint arrays leverage CPU L1/L2 cache locality and branch prediction during binary search. Tree nodes in JavaScript require separate object heap allocations, pointer chasing, and garbage collection pressure that degrade p99 tail latency.

---

## 4. Pathological Book Sweep (Experiment F6)

In failure experiment F6 (`apps/engine/tests/test.f6-pathological-sweep.ts`), 10,000 distinct price levels on the ask side ($50,001 to $60,000) were swept by a single market order:
- **Execution Time:** 5.95 ms
- **Throughput:** 1,679,778 fills/sec
- **Invariants Verified:**
  - `M1`: Taker quantity executed exactly 10,000; remaining quantity = 0.
  - `M3`: Strict price-time priority maintained across all 10,000 fills.
  - `M4`: Book never rested crossed; asks drained to 0, bids remained 0.
  - `L4`: Total maker quantity executed equals taker quantity (conservation of quantity).

---

## 5. Concurrency & Margin Integrity (Experiment F3)

In failure experiment F3 (`apps/engine/tests/test.f3-concurrent-race.ts`), 20 leveraged positions were hammered with 12 rapid external index price swings ($57,000 to $43,000) while placing interleaved limit/market orders:
- **Invariants Verified:**
  - `R1`: Liquidations executed strictly off mark/index price, immune to book spikes.
  - `R2`: Safe positions survived swings; breached positions closed without overfills.
  - `L1`: Zero negative available balances and zero negative locked margins across all participants.

---

## 6. Audit Trail & Real-Time Metrics

- **Audit Chain (`apps/engine/src/audit/AuditLog.ts`):** Every deposit, order, fill, cancellation, and liquidation is recorded in an immutable, sequence-numbered SHA-256 hash chain that detects any data tampering.
- **Metrics Tracker (`apps/engine/src/metrics/MetricsCollector.ts`):** Real-time nanosecond-precision sliding window measuring p50, p90, p95, p99, throughput, and automatic anomaly alerting for latency spikes exceeding configurable thresholds.
