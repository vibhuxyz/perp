# Build Plan: Climbing the Quality Ladder

Breadth-first. Every component reaches a rung before any component climbs to the next one.
See DECISION-006 for why, and `PROJECT_ROADMAP.md` for the ladder definition and the current
per-component status table.

The frontend follows the same rungs on the same days — see `FRONTEND.md`. Several of its
rungs are blocked on engine work listed there; check that table before starting a UI day.

**The rule:** build the feature first. Improve it when the system asks you to, not when it
offends you. The matching engine stays naive until something concrete needs it faster — that
is the whole point, and it is the easiest rule to break.

> **Engineering-lab standard (DECISION-008):** each rung below also has an **Evidence** block —
> invariants, failure experiments, benchmarks. A rung is not done until its gate *and* its
> evidence are written down. Docs: `INVARIANTS.md`, `BENCHMARKS.md`, `FAILURES.md`.

| Rung | Days | The question it answers |
| :--- | :--- | :--- |
| **OK** | Day 1 | Does the whole thing exist and run end to end? |
| **GOOD** | Day 2 | Is it correct, and do tests prove it? |
| **BETTER** | Day 3–4 | Does it survive a restart and a duplicate message? |
| **AWESOME** | Day 5 | Is it fast, and can I see what it's doing? |
| **BEST** | Day 6–7 | Is it solvent, deployed, and alive without me? |

---

## Rung 1 — OK  *(Day 1 — done)*

**Goal:** an ugly end-to-end exchange. Place an order in a browser, watch it match, watch a
position get liquidated off a mark price that is not our own last traded price. Every number
can be wrong. Nothing may be missing.

**Fakes are allowed and encouraged at this rung:** mark price = a number that ticks on a timer,
persistence = a JSON file, funding = every 10 seconds instead of every 8 hours, no Kafka at all
(direct function calls). Swap the fakes for real infrastructure at BETTER, not now.

### Engine — split the god class
- [x] `isLiquidatable()` in `risk/risk.ts` — equity vs maintenance margin.
- [x] `liquidationChecks()` in `core/engine.ts` — collect-then-liquidate.
- [x] `core/Ledger.ts` — `lockMargin`, `unlockMargin`, `updatePosition`, `settlePnL`, `closePosition`.
- [x] `core/MatchingEngine.ts` — `createMarket`, `processOrder` routing to the right `Orderbook`.
- [x] `risk/RiskManager.ts` — `checkLiquidations` driving `ledger` + `matchingEngine`.
- [x] `core/Exchange.ts` — `placeOrder`: lock margin → match → update both sides per fill.
- [x] Delete `core/engine.ts`.

### Everything else to "it runs"
- [x] `apps/mark-price-poller` — random walk on a timer; not Binance yet, but not our own price.
- [x] Funding — `risk/funding.ts`, pays the premium between last trade and index every 10s.
- [x] `apps/server` — order and deposit routes call the engine directly. No Kafka.
- [x] `apps/db-writer` — full-state JSON snapshot every 5s.
- [x] `apps/ws` — `MarketFeed` broadcasts fills, index ticks, funding and liquidations.
- [x] `apps/web` — shell + trade/positions/history: token, deposit, order form, polled depth,
      positions, live feed. Chart is generated candles (real `/candles` is BETTER).

**Gate passed:** `bun apps/engine/tests/test.engine.ts` — 23/23 including no negative balances.
End to end over REST: deposit → limit order rests → market order fills → position appears →
depth updates → funding nets to zero across long and short.

### Found while building, deferred on purpose
- A `MARKET` order that finds no liquidity silently locks no margin and vanishes. It now reports
  `cancelled` rather than `resting`, but the engine still has no concept of rejecting it.
- `Orderbook` re-sorts its price keys on every order. Fine here; revisit at AWESOME, with a
  benchmark, not before.
- No order cancellation route exists yet, so resting margin can only be released by a fill.

---

## Rung 2 — GOOD  *(Day 2 — done)*

**Goal:** the numbers are right, and tests say so. This is where the deferred test suite lands
(DECISION-007) and where the known money bugs finally get fixed.

- [x] Maker margin stays locked on fill; released only on close or cancel.
- [x] Taker margin stays locked when a market order opens a position.
- [x] `liquidatePosition()` settles from the actual close fills, not the price passed in.
- [x] Counterparty (maker) position updates on a liquidation fill.
- [x] Partial liquidation fill shrinks the position; it never silently disappears.
- [x] BigInt truncation audit — carry `totalNotional` + `totalQuantity` instead of re-dividing
      for average entry price; re-check liquidation price and maintenance margin.
- [x] Real mark price — Binance REST/WS index, median or EMA, fed into `RiskManager`.
- [x] Funding on a real schedule with the real premium formula.
- [x] Engine test suite in `apps/engine/tests/`: resting depth, partial fills across levels,
      market order sweeping a thin book, multi-user liquidation in a crash, position flip.
- [x] API input validation and sane error codes.

### Needed by the frontend at this rung
- [x] Broadcast orderbook depth on the feed so the UI can stop polling `/api/depth`.
- [x] Ticker payload: 24h change, current funding rate, next funding time.
- [x] Track resting orders per user, and add a cancel route — the UI has no Open Orders
      panel and no way to release resting margin without a fill.
- [x] Reject reasons in error responses specific enough to render (available vs required).

**Evidence (GOOD):**
- [x] Tests assert invariants M1–M4, L1, L4, R1–R4 from `INVARIANTS.md`; update their status.
- [x] Determinism test: run the same seeded command sequence twice, assert identical state (M2).
- [x] Failure experiment F4 (scam wick) recorded in `FAILURES.md`.

**Gate:** simulate a scam wick on the local book — the risk engine ignores it because the index
price is stable. Funding debits longs and credits shorts symmetrically.

---

## Rung 3 — BETTER  *(Day 3–4)*

**Goal:** kill the process at any moment and lose nothing. Deliver every message twice and
change nothing.

- [x] Write-ahead log — append every accepted command to disk before mutating memory.
- [x] Deterministic boot replay reconstructing orderbook + positions from the WAL.
- [x] Idempotency keys on orders and fills; a replayed event cannot double-credit.
- [x] Risk and balance correctness (P0) — atomic transitions, explicit order lifecycle states (`NEW` -> `RESTING` -> `PARTIALLY_FILLED` -> `FILLED` / `CANCELLED` / `REJECTED`), and fail-closed pre-trade risk checks (`apps/engine/src/core/order-state.ts`, `apps/engine/src/risk/pre-trade.ts`, `test.p0-balance-correctness.ts`).
- [x] Durable command and event processing (P0) — strict 4-phase ordering (`acceptance` -> `fsync` -> `mutation` -> `publication`), boundary crash recovery, and business-level idempotency (`apps/engine/src/pipeline/`, `test.p0-durable-processing.ts`).
- [x] Single-writer engine with fencing (P0) — market-keyed partitioning, ownership leases with monotonic fencing tokens, and storage fencing barriers preventing split-brain corruption (`apps/engine/src/fencing/`, `test.p0-single-writer-fencing.ts`).
- [x] Deposit/withdrawal safety — replay callbacks, simulate timeouts, verify retries cannot duplicate credits or withdrawals (`test.deposit-withdrawal-safety.ts`).
- [x] Snapshot & replay optimization — restore state snapshot plus subsequent log entries and verify state hash against full replay (`test.snapshot-replay.ts`).
- [x] Disaster recovery — restore database backups and engine state in a clean environment; record actual recovery time and data loss (`test.disaster-recovery.ts`).
- [x] Property-based ledger conservation — randomized transitions across fees, partial fills, funding, cancellations, liquidation, and bankruptcy (`test.property-conservation.ts`).
- [x] Kafka replaces the direct calls — `order.commands` keyed by market, `engine.events` out.
- [x] `apps/db-writer` consumes `engine.events` → Redis cache + batched TimescaleDB writes (Drizzle).
- [x] Read routes (`/positions/open`, `/equity/available`) served from Redis.
- [x] Reconciliation job: `deposits === available + locked + insurance + fees`, alarm on drift.

### Needed by the frontend at this rung
- [x] Sequence number on every book update, plus a snapshot endpoint to resync against.
- [x] Subscribe/unsubscribe protocol with channels instead of one firehose, including
      authenticated private channels for positions, orders and fills.
- [x] Candle storage on Timescale hypertables and a `/candles` route. The chart panel already
      paints generated candles via lightweight-charts; this swap is what makes them real.
- [x] Paginated trade history and order history, so the feed is not empty on page load and
      the history table has something to virtualize.
- [x] Create more than one market. `createMarket()` already supports it; only `BTC-PERP`
      exists, so there is no watchlist and nothing to switch between.

**Evidence (BETTER):**
- [x] Failure experiments F1 (kill -9 + replay), F2 (duplicate delivery), F7 (corrupt WAL tail), F8 (deposit/withdrawal replay callbacks), F9 (snapshot state equivalence), F10 (clean-room disaster recovery), F11 (property-based conservation), F12 (fail-closed risk validation), F13 (pipeline boundary crash recovery), F14 (split-brain fencing barrier).
- [x] Invariants D1–D5, L1–L5, and R1–R5 status moved to `stressed` in `INVARIANTS.md`.
- [x] Study before building: Kafka partitions/offsets/delivery semantics, Postgres/Timescale
      WAL/MVCC, hypertables. Build the minimal engine WAL yourself first, then compare with Kafka (`docs/PERSISTENCE_PARADIGMS.md`).
- [x] Writeup: "Rebuilding exchange state from a WAL" (`docs/WAL_RECOVERY.md`).

**Gate:** `kill -9` the engine mid-trading, restart, and balances and orderbook match exactly.

---

## Rung 4 — AWESOME  *(Day 5 — done)*

**Goal:** fast, and visible. This is the first rung where the matching engine is allowed to
stop being naive — and only against a benchmark that proves the array sort is the bottleneck.

- [x] Create `benchmarks/` (repeatable harness, seeded flow) and `profiling/` (flamegraphs).
- [x] Benchmark first. Record throughput and p50/p95/p99 in `BENCHMARKS.md` before changing any
      data structure, at 1x/10x/100x order rates.
- [x] Profile (Node CPU profile, event-loop delay, heap snapshot) and name the real bottleneck.
- [x] Compare designs: sorted array vs red-black tree vs sorted keys + Map. Pick with numbers.
- [x] Replace array-sorted price levels with a sorted structure *if the benchmark justifies it*.
- [x] Failure experiments F3 (price updates racing order flow) and F6 (100K-order sweep).
- [x] Writeup: "Where the matching engine's latency goes" in `docs/LATENCY.md`.
- [x] Load test: concurrent order flow plus rapid index price updates, hunting margin-check races (`test.f3-concurrent-race.ts`).
- [x] Immutable audit log of every order, fill, and liquidation (`apps/engine/src/audit/`).
- [x] Latency + throughput metrics, alerting on anomalies (`apps/engine/src/metrics/`).

**Gate passed:** measured p50/p99 numbers written down in `BENCHMARKS.md`. 503x speedup on deep books (1.76M ops/sec, 0.002 ms p99). No invented numbers.

---

## Rung 5 — BEST  *(Day 6–7)*

**Goal:** solvent under a gap, and alive without supervision.

- [x] Insurance fund collecting liquidation penalties; absorbs bankruptcy deficits.
- [x] Auto-Deleveraging when the fund drains — queue by leverage and unrealised profit (`apps/engine/src/risk/adl.ts`).
- [x] Cross margin (`apps/engine/src/risk/margin.ts`).
- [x] Maker/taker fee tiers (`apps/engine/src/core/fees.ts`).
- [x] Market-making bots quoting around mark price; trader bots generating flow (`apps/engine/src/bots/`).
- [x] Containerised deploy (`infrastructure/compose/docker-compose.prod.yml` and service Dockerfiles).
- [x] Move auth to `HttpOnly; Secure; SameSite` cookies with CSRF protection, so the browser
      stops holding a JWT in `localStorage`.

**Evidence (BEST):**
- [x] Failure experiment F5 (gap past bankruptcy price, insurance fund drained, ADL verified in `test.f5-gap-adl.ts`).
- [x] 10x/100x scale analysis: what breaks first, what changes (`docs/SCALE_ANALYSIS.md`).
- [x] Fill the Definition of Done answers in `docs/PROJECT_ROADMAP.md`.

**Gate passed:** full stack with MarketMaker and NoiseTrader bots trading autonomously, maintaining solvency and zero drift (`test.bots-solvency.ts`).

---

## Repository layout for the lab

New top-level folders, created when their first rung needs them (not before):

```text
benchmarks/       repeatable harnesses (AWESOME)
failure-tests/    fault injection scripts (BETTER)
profiling/        flamegraphs, CPU/heap profiles (AWESOME)
docs/experiments/ one short writeup per experiment
```

## Parked

Things deliberately not being done, so they stop being re-litigated.

- Go/Rust port of the engine — DECISION-002, revisit only if TS is the proven bottleneck.
- Red-black tree orderbook — Rung 4, and only against a benchmark.
- Multi-collateral — not on the ladder at all yet.
