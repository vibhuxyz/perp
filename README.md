# perp-v2

A centralized perpetual-futures exchange (single market `BTC-PERP`, USDC collateral) built as an engineering laboratory. The question this repo is answering:

> How fast can orders be matched deterministically, where is the latency bottleneck, and can the exact state be reconstructed after a crash?

TypeScript matching engine, JWT auth, Vite trading terminal. Not on-chain.

## Current state

**Quality rung: OK.** Every component runs end to end. **Next: GOOD.**

Working today: deposit → limit rests → market fills → position appears → a ticking index drives liquidation checks and funding → WebSocket firehose → JSON snapshots every 5s.

Known and deliberate: maker/taker margin accounting is wrong, liquidations settle off the index instead of the close fills and skip the counterparty, the engine is in-process (no Kafka on the order path), the index is a random walk, the chart paints generated candles.

Build queue: [`docs/TODO.md`](docs/TODO.md). Living roadmap: [`docs/PROJECT_ROADMAP.md`](docs/PROJECT_ROADMAP.md). This file and [`ROADMAP.md`](ROADMAP.md) match that queue.

## Architecture (today vs target)

```
Browser (apps/web)
    │  REST + JWT          │  WebSocket
    ▼                      ▼
apps/api-gateway        apps/ws  (one firehose, no channels)
    │
    ▼
apps/server  ──in-process──►  apps/engine
    │                         MatchingEngine + Ledger + RiskManager
    │                         mark-price-poller (random walk)
    └── JSON snapshot ──►  apps/db-writer  (full rewrite every 5s)
```

Target at the BETTER rung: API → Kafka `order.commands` → engine → `engine.events` → Redis + TimescaleDB. WAL before every mutation. Candles and trades as hypertables.

## Repo layout

| Path | Role |
|---|---|
| `apps/engine` | In-memory matching, ledger, risk, funding |
| `apps/server` | Express REST; calls the engine directly |
| `apps/ws` | Market feed firehose |
| `apps/web` | Vite + React terminal |
| `apps/mark-price-poller` | Index price (random walk at OK; Binance at GOOD) |
| `apps/db-writer` | JSON snapshot of engine state |
| `apps/api-gateway` | CORS, rate limit, proxy to `apps/server` |
| `packages/db` | Drizzle schema (TimescaleDB / Postgres) |
| `packages/shared` | Kafka + Redis clients (wired at BETTER) |
| `infrastructure/compose` | Kafka, Kafdrop, Redis, TimescaleDB, MinIO |

## Infrastructure

`infrastructure/compose/docker-compose.dev.yml` runs:

- **TimescaleDB** `2.30.2-pg16` on `localhost:5432` — Postgres wire protocol plus hypertables. Relational tables (users, orders, positions, collateral) stay ordinary Postgres tables. Trades and candles become hypertables when `/candles` and batched fill writes land (BETTER).
- **Redis** `6379` — cache at BETTER; unused on the request path today.
- **Kafka** (KRaft, no Zookeeper) `29092` from the host, plus Kafdrop on `9005`.
- **MinIO** `9000` / console `9001` — snapshots at BETTER.

`DATABASE_URL=postgres://perp:password@localhost:5432/perp_db` is unchanged. Timescale is a Postgres extension, not a second database.

If you previously ran `postgres:15-alpine` on the `pgdata` volume, that data directory is not compatible. Recreate the volume once:

```bash
docker compose -f infrastructure/compose/docker-compose.dev.yml down -v
docker compose -f infrastructure/compose/docker-compose.dev.yml up -d
```

## Run locally

```bash
bun install
cp env.example .env
docker compose -f infrastructure/compose/docker-compose.dev.yml up -d
bun run dev
```

| Process | URL |
|---|---|
| Web UI | http://localhost:5173 |
| API | http://localhost:6000 |
| Gateway | http://localhost:8080 |
| WebSocket | ws://localhost:7070 |
| Kafdrop | http://localhost:9005 |
| MinIO console | http://localhost:9001 |

Engine smoke (23 checks, including no negative balances):

```bash
bun apps/engine/tests/test.engine.ts
```

## Quality ladder

Every component climbs **OK → GOOD → BETTER → AWESOME → BEST** together. No component climbs until every component is on the rung below. Details: [`docs/TODO.md`](docs/TODO.md), [`docs/DECISIONS.md`](docs/DECISIONS.md) (006–008).

| Rung | Meaning | Status |
|---|---|---|
| OK | It runs end to end. Fakes allowed. | **Done** |
| GOOD | Numbers are right. Invariants tested. | **Current** |
| BETTER | WAL, Kafka, Timescale hypertables, survives `kill -9`. | Next |
| AWESOME | Measured latency. Profile before changing the book. | Later |
| BEST | Insurance fund, ADL, bots, deploy. | Later |

Hand-write matching, margin, liquidation, WAL, invariants. Hybrid for Kafka / Redis / Timescale / Docker. Vibe-code the UI.

## Docs

| File | What it is |
|---|---|
| [`docs/TODO.md`](docs/TODO.md) | Build queue. Start here. |
| [`docs/PROJECT_ROADMAP.md`](docs/PROJECT_ROADMAP.md) | Ladder, component table, production stack |
| [`ROADMAP.md`](ROADMAP.md) | Same plan, short form |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Architecture decisions. 001/003/005 are historical. |
| [`docs/INVARIANTS.md`](docs/INVARIANTS.md) | Properties tests must prove |
| [`docs/FAILURES.md`](docs/FAILURES.md) | Fault-injection log (none run yet) |
| [`docs/BENCHMARKS.md`](docs/BENCHMARKS.md) | Latency numbers (none recorded yet) |
| [`docs/FRONTEND.md`](docs/FRONTEND.md) | Terminal architecture. Status block is behind the UI. |
| [`docs/SESSION_01.md`](docs/SESSION_01.md)–[`10`](docs/SESSION_10.md) | Historical diary. Not current state. |
| [`docs/PaperTrade_Design_System_UX.docx`](docs/PaperTrade_Design_System_UX.docx) | Learner-terminal UX spec |

## Next to build (GOOD)

1. Maker margin stays locked on fill; released on close or cancel. Taker margin locks when a market order opens a position. (`apps/engine/src/core/Exchange.ts`, `Ledger.ts`)
2. Liquidations settle from actual close fills, update the counterparty, and shrink on a partial fill. (`RiskManager.ts`)
3. Carry `totalNotional` + `totalQuantity` instead of re-dividing average price.
4. Engine tests for invariants M1–M4, L1, L4, R1–R4. Scam-wick experiment F4.
5. Real Binance index. Funding on a real schedule. Cancel route. Depth on the WebSocket feed.
