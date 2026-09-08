# Project Roadmap

This roadmap tracks the development of the Perpetual DEX/CEX. It maps the overall project
phases into our iterative development cycles (V0 prototype -> V4 production).

> **Scope change (Session 10):** the target moved from "MVP that matches orders" to
> **production-level perpetual exchange**. See DECISION-004. The phase list below is unchanged,
> but the *priority order* is now driven by the Production Priority Stack.

## Current State
*   **Current Phase:** Phase 3.5: The Liquidation Engine
*   **Completed:** ✅ Phase 2 Core API, ✅ Phase 3 Matching Engine, ✅ Phase 3 V3 Leverage/Initial Margin
*   **Current Task:** 🚧 P1 — finish `isLiquidatable()` and wire `liquidationChecks()` → `liquidatePosition()`
*   **Blocked:** 🚫 Phase 4 (persistence) until the engine is trustworthy (test gate, DECISION-003)
*   **Upcoming Milestone:** a position that breaches Maintenance Margin gets force-closed automatically,
    end to end, with a mark price that is not our own last traded price.

---

## Production Priority Stack

The ordered list of what makes this "production level". Highest first — each item is only
worth doing once the ones above it hold.

### P1 — Liquidation, Funding, and Mark Price  *(in progress)*
The actual perpetual-futures mechanics. Nothing else matters if this is wrong — it *is* the product.
*   [~] Maintenance Margin math — `risk.ts` has `positionEquity()` and `maintenanceMargin()`;
        `isLiquidatable()` is still an empty stub.
*   [ ] Close the liquidation loop — `liquidationChecks()` is TODO-only; must collect breaching
        positions **first**, then liquidate (liquidating while iterating mutates the list).
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
*   [x] **V3 (Production):** Setup Docker (`docker-compose up`) for Postgres, Redis, Kafka, MinIO.

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
*   [~] **V1:** Risk Engine — `liquidationChecks()` scans positions vs index price, currently TODO-only.
*   [~] **V2:** Liquidation Executor — `liquidatePosition()` submits a forced MARKET order and settles
        margin+PnL. Not wired to `liquidationChecks()` yet, and it ignores the real close fills.
*   [~] **V2.2:** Maintenance Margin trigger — `config.ts` (MMR 2%) + `risk.ts` exist;
        `isLiquidatable()` is an empty stub.
*   [ ] **V2.1:** Wire `liquidationChecks()` to actually call `liquidatePosition()`.
*   [ ] **V3:** Cross Margin (using the entire account balance for protection).
*   [ ] **V4:** Insurance Fund & Auto-Deleveraging (ADL).  — P4

### Phase 3.6: The Economics Engine  — P1
*   [ ] **V0:** Maker/Taker Trading Fees.
*   [ ] **V1:** Funding Rates (Longs pay Shorts) on a fixed schedule.

### Phase 3.7: Mark Price / Oracle  — P1
*   [~] `apps/mark-price-poller` scaffolded (empty — prints "Hello via Bun!").
*   [ ] Poll external venues, publish an index price, blend into a mark price.
*   [ ] Risk engine consumes mark price instead of `lastTradedPrice`.

### Phase 4: Persistence & Redis Caching  — gated on P3
*   [~] `apps/db-writer` scaffolded (empty).
*   [ ] **V1/V3:** Node.js worker consumes `engine.events`. Update Redis. Batch writes to PostgreSQL.
*   [ ] Idempotent consumption (dedupe on event id) so a replayed event can't double-credit.

### Phase 5: Real-Time WebSockets
*   [~] `apps/ws` scaffolded (`index.ts`, `redis.ts`, `socket.ts` — mostly empty).
*   [ ] **V3:** Connect to Kafka `market.events` and Redis pub/sub. Broadcast updates.

### Phase 6: The Frontend (Trading UI)
*   [~] `apps/web` scaffolded (Vite + React, components/pages present).
*   [ ] **V0:** Trading UI components (Orderbook, charts, forms).

### Phase 7: Crash Recovery & Snapshots  — P2
*   [ ] **V3/V4:** TS Engine memory serialization every 60s to MinIO.
*   [ ] **V3/V4:** Boot-sequence to download snapshot and replay unhandled Kafka commands.

### Phase 8: Load, Observability & Deploy  — P5/P6/P7
*   [ ] Load-test harness + benchmark numbers.
*   [ ] Immutable audit log, metrics, alerting.
*   [ ] Deployed URL with demo accounts and an order-flow bot.

Legend: `[x]` done · `[~]` prototyped or scaffolded, uncommitted/untested · `[ ]` not started.
