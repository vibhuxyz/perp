# Project Roadmap

This roadmap tracks the development of the Perpetual DEX/CEX. It maps the overall project
phases into our iterative development cycles (V0 prototype -> V4 production).

> **Scope change (Session 10):** the target moved from "MVP that matches orders" to
> **production-level perpetual exchange**. See DECISION-004.
>
> **Build order change:** we now build **breadth-first** — every component reaches a working-but-ugly
> state before any component is improved. See DECISION-006 and the Quality Ladder below. The
> Production Priority Stack still describes *what good looks like*; it no longer dictates *what
> order we build in*.

## Current State
*   **Current Rung:** OK reached — every component runs end to end
*   **Working:** REST order + deposit → engine → fills → positions, ticking index price driving
    liquidation checks and funding, WebSocket firehose, JSON state snapshots, trading-terminal UI
    (shell, ticket, book, positions, generated candles)
*   **Current Task:** 📌 climb to GOOD — fix the margin accounting bugs, settle liquidations from
    actual fills, real Binance index, and write the engine test suite
*   **Infra:** TimescaleDB (PG16) on `:5432`, Redis, Kafka (KRaft), MinIO. Orders still skip Kafka.
*   **Not blocked by anything** — the old test gate is the GOOD rung, not a blocker (DECISION-007)
*   **Known and deliberate:** maker/taker margin accounting is wrong, liquidations settle off the
    index rather than the close fills and skip the counterparty, and everything runs in one process.
*   **Docs:** `TODO.md` is the queue. Root `README.md` and `ROADMAP.md` match this file.
    `SESSION_*.md` are historical. `FRONTEND.md` architecture is live; its status block lags the UI.

> **Standard of evidence (DECISION-008):** this project is an engineering laboratory, not a feature
> factory. Every rung is judged by invariants (`INVARIANTS.md`), benchmarks (`BENCHMARKS.md`) and
> failure experiments (`FAILURES.md`), not by the number of features shipped.

---

## Engineering Question

> How fast can orders be matched deterministically, where is the latency bottleneck, and can the
> exact state be reconstructed after a crash?

Sub-questions: can matching stay deterministic under concurrency? Do price updates race with
margin checks? What is p99 at 1x to 100x load? What is recovery time after `kill -9`?

Loop for every subsystem: hard problem -> first principles -> minimal baseline -> benchmark ->
profile -> find bottleneck -> optimise -> break it -> recover -> benchmark again -> explain.

## The Quality Ladder

Every component climbs the same five rungs. **No component climbs a rung until every component is
standing on the rung below it.** Build the feature first; improve it when the system asks you to.

| Rung | What it means | Allowed to be |
| :--- | :--- | :--- |
| **OK** | It runs. Happy path only, in-memory, hardcoded values fine. This is the V0 baseline. | Ugly, naive, faked dependencies |
| **GOOD** | Edge cases handled, inputs validated, errors sane, tests exist. **Invariants written down and tested.** | Slow, single-process |
| **BETTER** | Durable — persistence, idempotency, survives a restart. **Crash and duplicate-delivery experiments run.** | Unoptimised |
| **AWESOME** | Fast — real data structures, **baseline benchmark, profile, before/after numbers, alternatives compared.** | Single-region |
| **BEST** | Production — scale, solvency guarantees, alerting, deployed. **10x/100x scale analysis and writeups done.** | — |

**The pull rule (the only exception):** if building feature X genuinely needs component Y one rung
higher, raise Y *then*, and only as far as X needs. "It would be nicer" is not a reason. The
matching engine in particular stays naive until something concrete demands better — an array sort
per order is fine at OK, and it gets a proper tree when load testing proves it is the bottleneck,
not before.

**At the OK rung, a dependency is allowed to be a fake.** Mark price can be a number that ticks on
a timer. Persistence can be a JSON file. Funding can fire every 10 seconds instead of 8 hours.
The point of the rung is that the *shape* of the system is complete, not that any part of it is good.

**Optimisation rule:** no data-structure or design change without a recorded baseline and a
profile showing the bottleneck. Record before -> after and the trade-off in `BENCHMARKS.md`.

### Where each component stands

| Component | Rung | Note |
| :--- | :--- | :--- |
| Matching engine (`core/orderbook.ts`) | OK | Array-sorted levels, limit + market, partial fills |
| Ledger / collateral (`core/Ledger.ts`) | OK | Own class now; margin accounting still wrong |
| Risk / liquidation (`risk/RiskManager.ts`) | OK | Settles off index price, skips the counterparty |
| Mark price / oracle | OK | Random walk on a timer, not a real venue |
| Funding (`risk/funding.ts`) | OK | Every 10s off last trade vs index; nets to zero |
| Core API (`apps/server`) | OK | Calls the engine directly, in-process, no Kafka |
| WebSocket feed (`apps/ws`) | OK | `MarketFeed` firehose, no channels, no auth |
| Web UI (`apps/web`) | OK | Shell + trade/positions/history/learn. Depth polled. Chart is lightweight-charts with generated candles |
| Persistence (`apps/db-writer`) | OK | Full-state JSON rewrite every 5s. TimescaleDB running; hypertables unused |
| TimescaleDB | OK | Docker image `2.30.2-pg16`, extension enabled. Candles/trades hypertables at BETTER |
| Bots / load | — | Not started, lives at BEST |

### Build manually vs vibe code (owning the decisions)
*   **Write by hand:** matching engine, orderbook, ledger/margin math, liquidation logic, WAL and
    replay, idempotency, invariants, benchmark design, recovery logic.
*   **Hybrid (AI helps, I read every line):** Kafka/Redis/TimescaleDB plumbing, Docker, serialization,
    test scaffolding, API wrappers.
*   **Vibe code freely:** web UI, forms, dashboards, boilerplate types, docs formatting.

---

## Production Priority Stack

What "production level" eventually means, highest-impact first. **This is a definition of done,
not a build order** — under DECISION-006 we reach these by climbing the ladder across all
components, not by finishing P1 before starting P2.

### P1 — Liquidation, Funding, and Mark Price  *(in progress)*
The actual perpetual-futures mechanics. Get these wrong and nothing else matters — they *are* the product.
*   [x] Maintenance Margin math — `risk/risk.ts`: `positionEquity()`, `maintenanceMargin()`, `isLiquidatable()`.
*   [x] Close the liquidation loop — `liquidationChecks()` collects breaching positions **first**,
        then liquidates (liquidating while iterating mutates the list).
*   [x] Settle liquidations from the actual close fills, not the oracle price passed in.
*   [ ] Mark price from an index/blend (external oracle), not `lastTradedPrice` — anti scam-wick.
*   [ ] Funding settlement on a schedule (longs pay shorts / vice versa).
*   [ ] Real-time margin tracking as the mark price ticks.

### P2 — Crash-safe State (WAL / event log)
The engine is in-memory for speed, which means a crash or restart loses every open order and
position today.
*   [ ] Append-only write-ahead log of every accepted command before it mutates state.
*   [ ] Deterministic replay on boot to reconstruct the orderbook + positions.
*   [ ] Periodic snapshot so replay doesn't start from time zero. (This is Phase 7.)

### P3 — Financial Correctness & Idempotency
*   [x] Integer-only money/size math (`bigint`) — no floats anywhere. Done in Phase 3.1.
*   [ ] Audit every `bigint` division for truncation loss (average price, margin, liq price).
*   [ ] Idempotent fill processing — a retried or duplicated event must not double-credit a balance.
*   [ ] Reconciliation job: position ledger vs wallet ledger must agree, continuously.

### P4 — Insurance Fund / Bankruptcy Handling
When price gaps past the liquidation price, the forced close may not cover the loss.
*   [ ] Insurance fund funded by liquidation penalties.
*   [ ] Auto-Deleveraging (ADL) or socialized loss when the fund is drained.

### P5 — Load Testing & Benchmarking
*   [ ] Prove latency/throughput under real concurrent load instead of claiming numbers.
*   [ ] Specifically stress margin-check races during rapid price updates — where liquidation bugs hide.

### P6 — Observability & Audit Trail
*   [ ] Immutable log of every order, fill, and liquidation.
*   [ ] Latency + throughput metrics, alerting on anomalies.

### P7 — Deploy with Seeded, Bot-driven Activity
*   [ ] Live URL, demo accounts, and a bot generating order flow so the book isn't empty and dead.

---

## Phases (Mapped from roadmap.md)

### Phase 1: Infrastructure & Data Definition
*   [x] **Phase 0 (Product Understanding):** Align on core MVP requirements.
*   [x] **V0 (Prototype):** Define basic TS interfaces (`Order`, `Fill`, `Balance`) without external deps.
*   [x] **V1 (Persistence):** Define Drizzle Schema for PostgreSQL.
*   [x] **V3 (Production):** Docker for TimescaleDB (PG16), Redis, Kafka (KRaft), MinIO. DECISION-009.

### Phase 2: The Core API & Queue Entry
*   [x] **Phase 0:** Requirements for the ingestion layer.
*   [x] **V0:** Build stateless Express/Next.js API. Accept order JSON and validate.
*   [x] **V1/V2:** Add JWT authentication.
*   [ ] **V3:** Connect API to Kafka to push into `order.commands` topic.

### Phase 3: The TypeScript Matching Engine
*   [x] **Phase 0:** Requirements for order matching.
*   [x] **V1:** In-memory Orderbook, Limit orders, partial fills, multi-market.
*   [x] **V2:** Market Orders and basic liquidation loop.
*   [x] **V3:** Leverage and Initial Margin calculations.
*   [x] **V3.1:** Migrated all money/size math from `number` to `bigint` (floating-point trap).

### Phase 3.5: The Liquidation Engine (Risk Management)  — P1
*   [~] **V0:** PnL Engine — `calculatePnL()` exists, prototyped.
*   [x] **V1:** Risk Engine — `liquidationChecks()` scans positions vs index price, collect-then-liquidate.
*   [x] **V2:** Liquidation Executor — `liquidatePosition()` submits a forced MARKET order, settles
        margin+PnL from actual close fills, updates counterparties, and shrinks partial liquidations.
*   [x] **V2.2:** Maintenance Margin trigger — `risk/config.ts` (MMR 2%) + `isLiquidatable()`.
*   [x] **V2.1:** Wire `liquidationChecks()` to actually call `liquidatePosition()`.
*   [ ] **V3:** Cross Margin (using the entire account balance for protection).
*   [ ] **V4:** Insurance Fund & Auto-Deleveraging (ADL).  — P4

### Phase 3.6: The Economics Engine  — P1
*   [~] **V0:** Funding prototype — `risk/funding.ts` pays last-trade vs index every 10s, nets to zero.
*   [ ] Maker/Taker trading fees.
*   [ ] Funding on a real 8h schedule with the real premium formula.

### Phase 3.7: Mark Price / Oracle  — P1
*   [x] `apps/mark-price-poller` — random walk on a timer (OK fake). Same `startPoller` interface for Binance.
*   [ ] Poll external venues, publish an index price, blend into a mark price.
*   [ ] Risk engine consumes mark price instead of `lastTradedPrice`.

### Phase 4: Persistence & Redis Caching  — BETTER
*   [x] `apps/db-writer` — full-state JSON snapshot every 5s (OK fake).
*   [x] TimescaleDB in Docker; `CREATE EXTENSION timescaledb` on first boot (DECISION-009).
*   [ ] **V1/V3:** Worker consumes `engine.events`. Redis cache. Batched Drizzle writes to TimescaleDB.
*   [ ] Hypertables for `trades` and `candles`; `GET /candles`.
*   [ ] Idempotent consumption (dedupe on event id) so a replayed event can't double-credit.

### Phase 5: Real-Time WebSockets
*   [x] `apps/ws` — `MarketFeed` broadcasts fills, index ticks, funding, liquidations. One firehose.
*   [ ] Channels, auth, sequence numbers, snapshot resync.
*   [ ] Connect to Kafka `market.events` and Redis pub/sub.

### Phase 6: The Frontend (Trading UI)
*   [x] `apps/web` — Vite + React 19, AppShell, lazy routes (trade, positions, history, learn, settings, signup), order ticket, polled depth, lightweight-charts with generated candles.
*   [ ] Stop polling depth once the engine broadcasts the book (GOOD, needs backend).
*   [ ] Chart reads `/candles` from Timescale instead of generated data (BETTER).

### Phase 7: Crash Recovery & Snapshots  — P2
*   [ ] **V3/V4:** TS Engine memory serialization every 60s to MinIO.
*   [ ] **V3/V4:** Boot-sequence to download snapshot and replay unhandled Kafka commands.

### Phase 8: Load, Observability & Deploy  — P5/P6/P7
*   [ ] Load-test harness + benchmark numbers.
*   [ ] Immutable audit log, metrics, alerting.
*   [ ] Deployed URL with demo accounts and an order-flow bot.

### Definition of Done for the project
Can I answer, with evidence: the hard problem solved, how it works internally, what I implemented
myself, the invariants, the benchmark, the bottleneck, the optimisation (before -> after), what
happens on failure, how it recovers, trade-offs, alternatives rejected, what changes at 10x/100x,
and can I explain it without hiding behind frameworks.

### Writeups
Each major experiment ends in a short writeup (naive design -> benchmark -> profile -> change ->
before/after -> trade-off -> next question). Evidence over adjectives. Stored in `docs/experiments/`.

Legend: `[x]` done · `[~]` prototyped or scaffolded, uncommitted/untested · `[ ]` not started.
