# Roadmap

Canonical build queue: [`docs/TODO.md`](docs/TODO.md). Ladder, priorities, and per-component status: [`docs/PROJECT_ROADMAP.md`](docs/PROJECT_ROADMAP.md). Decisions: [`docs/DECISIONS.md`](docs/DECISIONS.md).

This file is the short current plan. It replaces the original Postman + Go-engine outline (superseded by DECISION-002: TypeScript engine, and DECISION-006: breadth-first quality ladder).

## Now

**Rung: GOOD.** OK is done. The whole stack runs; the numbers are not trustworthy yet.

| Component | Rung | Reality |
|---|---|---|
| Matching engine | OK | Array-sorted levels, limit + market, partial fills |
| Ledger | OK | Own class; maker/taker margin accounting is wrong |
| Risk / liquidation | OK | Settles off index price, skips the counterparty |
| Mark price | OK | Random walk, not Binance |
| Funding | OK | Every 10s, last trade vs index, nets to zero |
| Core API | OK | In-process `placeOrder`. Kafka producer exists; orders do not use it |
| WebSocket | OK | One firehose, no channels, no auth |
| Web UI | OK→GOOD | Shell, ticket, book, positions, generated candles. Depth still polled |
| Persistence | OK | JSON snapshot every 5s. TimescaleDB is up; hypertables not used yet |
| Bots / load | — | BEST |

## GOOD (current)

Fix money math, then prove it with tests. Do not start Kafka, a tree orderbook, or the insurance fund.

- Maker margin stays locked on fill; released only on close or cancel
- Taker margin stays locked when a market order opens a position
- `liquidatePosition()` settles from actual close fills
- Counterparty position updates on a liquidation fill
- Partial liquidation shrinks the position
- BigInt truncation audit (`totalNotional` + `totalQuantity`)
- Engine tests: invariants M1–M4, L1, L4, R1–R4
- Real Binance index into `RiskManager`
- Funding on a real schedule and premium formula
- API errors include available vs required margin
- Broadcast orderbook depth; ticker (24h change, funding rate, next funding)
- Resting orders per user + cancel route

**Gate:** scam wick on the local book (F4) does not liquidate while the index is stable. Funding debits longs and credits shorts symmetrically.

## BETTER

Survive a crash and a duplicate message.

- Write-ahead log, then deterministic replay
- Idempotency keys on orders and fills
- Kafka: `order.commands` keyed by market, `engine.events` out
- `db-writer` → Redis + batched **TimescaleDB** writes (Drizzle)
- Trades and candles as Timescale hypertables; `GET /candles`
- Read routes from Redis
- Reconciliation: `deposits === available + locked + insurance + fees`
- WS channels + sequence numbers + snapshot resync
- Paginated order/trade history; more than one market

**Gate:** `kill -9` the engine mid-trading, restart, balances and book match.

TimescaleDB is already in Docker (`timescale/timescaledb:2.30.2-pg16` on port 5432). Same `DATABASE_URL` as Postgres. Hypertables are created when candle/trade persistence is implemented, not before.

## AWESOME

Measure first. The array-sorted book stays until a profile says it is the bottleneck.

- `benchmarks/` harness, numbers in `docs/BENCHMARKS.md`
- Failure experiments F3 (price vs order race) and F6 (100K-order sweep)
- Audit log, latency metrics

## BEST

- Insurance fund + ADL
- Cross margin, maker/taker fees
- Market-making and flow bots
- Cookie auth (`HttpOnly; Secure; SameSite`)
- Deployed URL with demo accounts

**Gate:** the stack runs for an hour with bots and no manual intervention.

## How to verify (without claiming Kafka that is not on the path)

| Check | How |
|---|---|
| Infra | `docker compose -f infrastructure/compose/docker-compose.dev.yml up -d` — TimescaleDB, Redis, Kafka, MinIO |
| Schema | Drizzle Studio against `DATABASE_URL` |
| Signup / order | `POST /api/v1` auth then order on `apps/server` (in-process match, not `order.commands`) |
| Match | Two complementary orders; fills on the response and on the WS firehose |
| Engine math | `bun apps/engine/tests/test.engine.ts` |
| UI | http://localhost:5173 — deposit, place, see position. Chart is generated until `/candles` exists |

## Docs map

- Queue: `docs/TODO.md`
- Evidence: `docs/INVARIANTS.md`, `docs/FAILURES.md`, `docs/BENCHMARKS.md`
- Sessions 01–10: historical diary, not current state
- `docs/FRONTEND.md`: target terminal architecture; its “stands today” block lags `apps/web`
