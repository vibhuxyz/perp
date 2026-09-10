# 7-Day High-Intensity Sprint: V0 to V4 Production Perpetual Exchange

A 7-day engineering plan to take the perpetual exchange from V0 (in-memory prototype) to V4 (production-grade, crash-safe, bot-seeded exchange).

Aligned strictly with the **Production Priority Stack (P1–P7)** from `docs/PROJECT_ROADMAP.md` and `docs/DECISIONS.md`.

---

## Sprint Overview

| Day | Focus | Target Versions & Priorities | Primary Deliverable |
| :--- | :--- | :--- | :--- |
| **Day 1** | **V1 Modular Engine & Settlement** | V1 / P1 (Risk & Ledger) | Modular `Ledger`, `MatchingEngine`, `RiskManager` with execution-fill settlement |
| **Day 2** | **Mark Price, Funding & Margin Bugs** | V1–V2 / P1 (Perp Mechanics) | `mark-price-poller` external oracle, funding rate settlement, maker margin fix |
| **Day 3** | **Deterministic Tests & Crash Recovery** | V2 / P2–P3 (Correctness & WAL) | Automated test suite gate, BigInt audit, Write-Ahead Log (WAL) & boot replay |
| **Day 4** | **Insurance Fund & Bankruptcy Protection** | V2–V3 / P4 (Solvency) | Insurance fund pool, Auto-Deleveraging (ADL), background balance reconciliation |
| **Day 5** | **Event Pipeline: Kafka Ingestion & Redis Cache** | V3 / Phase 2 & 4 (Persistence) | API Kafka producer, `db-writer` consumer, Redis user cache, batched Postgres writes |
| **Day 6** | **Real-Time WebSockets & Trading Terminal** | V3 / Phase 5 & 6 (Clients) | `apps/ws` broadcasting orderbook & fills, `apps/web` Next.js trading UI |
| **Day 7** | **Load Testing, Market Making Bots & Launch** | V4 / P5–P7 (Scale & Bots) | 5k req/s concurrency load test, liquidity MM bots, customer trade simulation |

---

## Day 1: Modular Engine Architecture & Execution-Based Settlement (P1)
**Goal:** Split the V0 "God Class" into clean domain components and ensure all liquidations settle against actual book fills.

- [x] Implement `isLiquidatable()` in `apps/engine/src/risk/risk.ts` comparing equity to maintenance margin. *(Done)*
- [x] Wire `liquidationChecks()` in `apps/engine/src/core/engine.ts` using collect-then-mutate. *(Done)*
- [ ] Implement `apps/engine/src/core/Ledger.ts`:
  - [ ] `lockMargin(userId, amount)`: Verify available balance and lock initial margin.
  - [ ] `unlockMargin(userId, amount)`: Safely release locked margin without allowing negative values.
  - [ ] `updatePosition(userId, market, side, fillQty, fillPrice, leverage)`: Isolated position tracking.
  - [ ] `settlePnL(userId, pnl, marginFreed)`: Realize cash PnL into available balance on position close.
- [ ] Implement `apps/engine/src/core/MatchingEngine.ts`:
  - [ ] Multi-market router to individual `Orderbook` instances.
  - [ ] Clean isolation from balance and ledger concerns.
- [ ] Implement `apps/engine/src/risk/RiskManager.ts` & update `liquidatePosition`:
  - [ ] Settle realized PnL per fill from `book.processOrder(closingOrder)` instead of oracle ticker.
  - [ ] Update counterparty (maker) position on book execution.
- [ ] Implement `apps/engine/src/core/Exchange.ts`:
  - [ ] Orchestrate `Ledger` -> `MatchingEngine` -> `Ledger` pipeline.
- **Verification Gate:**
  - Run `bun apps/engine/tests/test.engine.ts` verifying modular classes run end-to-end without negative balances.

---

## Day 2: External Mark Price, Funding Rate & Margin Bug Fixes (P1)
**Goal:** Protect exchange against scam wicks, implement the economic spring (funding), and resolve accounting bugs.

- [ ] Fix Maker margin release bug:
  - [ ] Maker margin must stay locked on fill; only release on position close or order cancellation.
- [ ] Fix Taker margin unlocking bug:
  - [ ] Ensure market taker opening a position keeps initial margin locked.
- [ ] Build `apps/mark-price-poller`:
  - [ ] Connect to Binance public WebSocket / REST API for BTC/USDT price.
  - [ ] Calculate EMA / median index price.
  - [ ] Emit index price to `RiskManager` / engine.
- [ ] Implement Funding Rate Engine:
  - [ ] Calculate premium/discount: `(perpMarketPrice - indexPrice) / indexPrice`.
  - [ ] Build 8-hour / periodic funding settlement: longs pay shorts if perp > index, shorts pay longs if perp < index.
  - [ ] Deduct/credit funding payments directly through `Ledger.ts`.
- **Verification Gate:**
  - Simulate an artificial scam wick on local orderbook; verify `RiskManager` ignores it because index price is stable.
  - Verify funding payment debits long balances and credits short balances symmetrically.

---

## Day 3: Deterministic Test Suite, BigInt Audit & Write-Ahead Log (P2 & P3)
**Goal:** Make the engine state machine 100% deterministic and crash-resilient.

- [ ] BigInt Precision Audit:
  - [ ] Store cumulative notional (`totalNotional`) and cumulative quantity (`totalQuantity`) to eliminate division truncation on average entry price.
  - [ ] Audit liquidation price and maintenance margin formulas.
- [ ] Automated Engine Test Suite (`apps/engine/tests/`):
  - [ ] Limit order placement, cancellation, and orderbook resting depth.
  - [ ] Partial fills across multiple price levels.
  - [ ] Market order sweeping thin books.
  - [ ] Multiple concurrent user liquidations under severe price crashes.
  - [ ] Position flip test (Long -> Short on crossing order).
- [ ] Write-Ahead Log (WAL) Implementation:
  - [ ] Append-only binary or JSON log writing every accepted command to disk before memory mutation.
  - [ ] Deterministic boot recovery: engine reads WAL from disk on startup and replays commands to reconstruct state.
- **Verification Gate:**
  - Crash the engine process (`kill -9`) mid-trading; restart engine and verify balances and orderbooks match pre-crash state exactly.

---

## Day 4: Insurance Fund, ADL & Continuous Reconciliation (P4)
**Goal:** Guarantee exchange solvency during violent market gaps and eliminate silent balance leaks.

- [ ] Insurance Fund Module:
  - [ ] Collect liquidation fees (difference between bankruptcy price and maintenance margin close) into `insuranceFundBalance`.
  - [ ] Absorb negative balance deficits if position closes below bankruptcy price ($0 equity).
- [ ] Auto-Deleveraging (ADL) Engine:
  - [ ] Build priority queue sorting open positions by leverage and unrealized profit percentage.
  - [ ] When Insurance Fund drops to 0, forcibly deleverage top profitable positions to close underwater positions without exchange loss.
- [ ] Continuous Reconciliation Background Job:
  - [ ] Invariant check: `Total User Deposits === Sum(Available Balances) + Sum(Margin Locked) + Insurance Fund + Realized Fees`.
  - [ ] Emit alarm if invariant diverges by even 1 cent.
- **Verification Gate:**
  - Simulate a flash crash where market slips past bankruptcy; verify Insurance Fund covers deficit. Drain the fund to 0 and verify ADL successfully deleverages winning traders.

---

## Day 5: Production Event Pipeline — Kafka & Redis Ingestion (V3 / Phase 2 & 4)
**Goal:** Connect the stateless API to the matching engine using Kafka as a shock absorber, and cache states in Redis.

- [ ] `apps/server` (Core API) Production Pipeline:
  - [ ] `POST /api/v1/order`: Validate payload, sign JWT, attach idempotency key (`UUID`).
  - [ ] Produce order commands to Kafka topic `order.commands` (partition key: `market`).
- [ ] Engine Kafka Integration:
  - [ ] Single-partition consumer reading `order.commands` strictly in chronological order.
  - [ ] Publish execution results to Kafka topic `engine.events`.
- [ ] Build `apps/db-writer`:
  - [ ] Consume `engine.events` from Kafka.
  - [ ] Update user available balances and open positions in Redis cache (`HSET user:collateral`).
  - [ ] Micro-batch trades (50 trades or 500ms) into PostgreSQL using Drizzle ORM.
- [ ] Update `apps/server` Read Routes:
  - [ ] `GET /api/v1/positions/open/:marketId`: Read sub-millisecond from Redis.
  - [ ] `GET /api/v1/equity/available`: Read sub-millisecond from Redis.
- **Verification Gate:**
  - Blast 1,000 orders via API; confirm orders sit in Kafka, execute sequentially in engine, reflect instantly in Redis, and persist in Postgres.

---

## Day 6: Real-Time WebSockets Gateway & Trading UI (V3 / Phase 5 & 6)
**Goal:** Broadcast sub-50ms live orderbook and fill feeds, and wire the Next.js trading terminal.

- [ ] Build `apps/ws` (WebSocket Server):
  - [ ] Subscribe to Kafka `market.events` and Redis Pub/Sub.
  - [ ] Public channels: `orderbook:<market>` (L2 orderbook depth), `trades:<market>`, `ticker:<market>`.
  - [ ] Private authenticated channels: `orders:<userId>`, `positions:<userId>`.
  - [ ] Handle connection heartbeats, client reconnections, and backpressure.
- [ ] Wire `apps/web` (Next.js Frontend):
  - [ ] Connect order entry form to `POST /api/v1/order`.
  - [ ] Connect live L2 orderbook visualizer to WebSocket `orderbook:BTC-PERP`.
  - [ ] Connect real-time Positions & PnL table to WebSocket private user channel.
- **Verification Gate:**
  - Open trading UI in browser; place limit order and watch orderbook update live over WebSockets without page reload.

---

## Day 7: Load Testing, Market Making Bots & Full Deployment (V4 / P5–P7)
**Goal:** Prove performance under concurrency, seed liquidity with bots, and deploy.

- [ ] Concurrency Load Testing Harness (P5):
  - [ ] Blast 5,000 orders/sec concurrently with 50 index price updates/sec.
  - [ ] Verify zero margin race conditions and measure p50 (<2ms) and p99 (<10ms) latency.
- [ ] Build Market Making (MM) Bots (P7):
  - [ ] Create automated bot quoting bid/ask spreads at ±0.1% around Mark Price.
  - [ ] Rebalance quotes as book fills to keep liquidity thick on both sides.
- [ ] Build Trader Simulation Bots (P7):
  - [ ] Random buyer/seller bots creating realistic market activity and turnover.
- [ ] Production Containerization & Deployment:
  - [ ] Configure `docker-compose.prod.yml` or K8s manifests for all microservices.
  - [ ] Deploy with live demo accounts and seeded bot activity.
- **Verification Gate:**
  - Launch entire stack; observe bots actively maintaining a live orderbook, simulated trades filling, and system running clean for 1 hour without manual intervention.
