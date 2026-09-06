# Project Roadmap

This roadmap tracks the development of the Perpetual DEX/CEX MVP. It maps the overall project phases from `roadmap.md` into our iterative development cycles.

## Current State
*   **Current Phase:** Phase 3.5: The Liquidation Engine
*   **Completed Tasks:** ✅ Phase 2 Core API, ✅ Phase 3 Matching Engine, ✅ Phase 3 V3 Leverage/Initial Margin
*   **Current Task:** 🚧 Phase 3.5 - V2.1 wire `liquidationChecks()` to `liquidatePosition()`
*   **Blocked Tasks:** 🚫 Phase 4 (Wait for Liquidation Engine)
*   **Next Tasks:** 📌 V2.2 Maintenance Margin ratio trigger, then commit the engine prototype
*   **Note:** Automated test suite deferred by choice (see DECISION-003). Revisit before Phase 4.
*   **Upcoming Milestone:** Liquidating a user safely with Maintenance Margin

> **Note (Session 09):** The engine code moved ahead of the docs between Sessions 08 and 09.
> The prototype for Phase 3.5 V0-V2 (PnL, position math, liquidation execution) already exists
> in `apps/engine/src` but is uncommitted. Session 09 catches the docs up. We chose to skip a
> formal test suite for now (DECISION-003) and build forward: wire the liquidation loop (V2.1)
> and move the trigger to Maintenance Margin (V2.2).

---

## Phases (Mapped from roadmap.md)

### Phase 1: Infrastructure & Data Definition (Current)
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

### Phase 3.5: The Liquidation Engine (Risk Management)
*   [~] **V0:** PnL Engine (Unrealized Profit & Loss) — `calculatePnL()` exists, prototyped.
*   [~] **V1:** Risk Engine — `liquidationChecks()` scans positions vs index price, only `console.log`s a hit.
*   [~] **V2:** Liquidation Executor — `liquidatePosition()` submits a forced MARKET order and settles margin+PnL. Not wired to `liquidationChecks()` yet.
*   [ ] **V2.1:** Wire `liquidationChecks()` to actually call `liquidatePosition()`.
*   [ ] **V2.2:** Switch liquidation trigger from full margin to a Maintenance Margin ratio.
*   [ ] **V3:** Cross Margin (Using entire account balance for protection).
*   [ ] **V4:** Insurance Fund & Auto-Deleveraging (ADL).

Legend: `[x]` done · `[~]` prototyped, uncommitted/untested · `[ ]` not started.

### Phase 3.6: The Economics Engine
*   [ ] **V0:** Maker/Taker Trading Fees.
*   [ ] **V1:** Funding Rates (Longs pay Shorts).

### Phase 4: Persistence & Redis Caching
*   [ ] **Phase 0:** Requirements for state synchronization.
*   [ ] **V1/V3:** Node.js worker consumes `engine.events`. Update Redis. Batch writes to PostgreSQL.

### Phase 5: Real-Time WebSockets
*   [ ] **Phase 0:** Requirements for live updates.
*   [ ] **V0:** WebSocket server setup.
*   [ ] **V3:** Connect to Kafka `market.events` and Redis pub/sub. Broadcast updates.

### Phase 6: The Frontend (Trading UI)
*   [ ] **Phase 0:** Requirements for trader UX.
*   [ ] **V0:** Trading UI components (Orderbook, charts, forms) in Next.js.

### Phase 7: Crash Recovery & Snapshots
*   [ ] **Phase 0:** Requirements for fault tolerance.
*   [ ] **V3/V4:** TS Engine memory serialization every 60s to MinIO.
*   [ ] **V3/V4:** Boot-sequence to download snapshot and replay unhandled Kafka commands.

### Phase 8: Advanced Exchange Mechanics
*   [ ] **Phase 0:** Requirements for margin/liquidations.
*   [ ] **V2/V3:** Mark-price poller (Binance), Funding Rates, Liquidations via Insurance Fund.
