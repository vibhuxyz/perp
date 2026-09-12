# Build Plan: Climbing the Quality Ladder

Breadth-first. Every component reaches a rung before any component climbs to the next one.
See DECISION-006 for why, and `PROJECT_ROADMAP.md` for the ladder definition and the current
per-component status table.

The frontend follows the same rungs on the same days — see `FRONTEND.md`. Several of its
rungs are blocked on engine work listed there; check that table before starting a UI day.

**The rule:** build the feature first. Improve it when the system asks you to, not when it
offends you. The matching engine stays naive until something concrete needs it faster — that
is the whole point, and it is the easiest rule to break.

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
- [x] `apps/web` — one page: token, deposit, order form, depth, positions, live feed.

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

## Rung 2 — GOOD  *(Day 2)*

**Goal:** the numbers are right, and tests say so. This is where the deferred test suite lands
(DECISION-007) and where the known money bugs finally get fixed.

- [ ] Maker margin stays locked on fill; released only on close or cancel.
- [ ] Taker margin stays locked when a market order opens a position.
- [ ] `liquidatePosition()` settles from the actual close fills, not the price passed in.
- [ ] Counterparty (maker) position updates on a liquidation fill.
- [ ] Partial liquidation fill shrinks the position; it never silently disappears.
- [ ] BigInt truncation audit — carry `totalNotional` + `totalQuantity` instead of re-dividing
      for average entry price; re-check liquidation price and maintenance margin.
- [ ] Real mark price — Binance REST/WS index, median or EMA, fed into `RiskManager`.
- [ ] Funding on a real schedule with the real premium formula.
- [ ] Engine test suite in `apps/engine/tests/`: resting depth, partial fills across levels,
      market order sweeping a thin book, multi-user liquidation in a crash, position flip.
- [ ] API input validation and sane error codes.

### Needed by the frontend at this rung
- [ ] Broadcast orderbook depth on the feed so the UI can stop polling `/api/depth`.
- [ ] Ticker payload: 24h change, current funding rate, next funding time.
- [ ] Track resting orders per user, and add a cancel route — the UI has no Open Orders
      panel and no way to release resting margin without a fill.
- [ ] Reject reasons in error responses specific enough to render (available vs required).

**Gate:** simulate a scam wick on the local book — the risk engine ignores it because the index
price is stable. Funding debits longs and credits shorts symmetrically.

---

## Rung 3 — BETTER  *(Day 3–4)*

**Goal:** kill the process at any moment and lose nothing. Deliver every message twice and
change nothing.

- [ ] Write-ahead log — append every accepted command to disk before mutating memory.
- [ ] Deterministic boot replay reconstructing orderbook + positions from the WAL.
- [ ] Idempotency keys on orders and fills; a replayed event cannot double-credit.
- [ ] Kafka replaces the direct calls — `order.commands` keyed by market, `engine.events` out.
- [ ] `apps/db-writer` consumes `engine.events` → Redis cache + batched Postgres writes (Drizzle).
- [ ] Read routes (`/positions/open`, `/equity/available`) served from Redis.
- [ ] Reconciliation job: `deposits === available + locked + insurance + fees`, alarm on drift.

### Needed by the frontend at this rung
- [ ] Sequence number on every book update, plus a snapshot endpoint to resync against.
- [ ] Subscribe/unsubscribe protocol with channels instead of one firehose, including
      authenticated private channels for positions, orders and fills.
- [ ] Candle storage and a `/candles` route. This blocks the whole chart panel, which is the
      centrepiece of the terminal — do it before any frontend chart work starts.
- [ ] Paginated trade history and order history, so the feed is not empty on page load and
      the history table has something to virtualize.
- [ ] Create more than one market. `createMarket()` already supports it; only `BTC-PERP`
      exists, so there is no watchlist and nothing to switch between.

**Gate:** `kill -9` the engine mid-trading, restart, and balances and orderbook match exactly.

---

## Rung 4 — AWESOME  *(Day 5)*

**Goal:** fast, and visible. This is the first rung where the matching engine is allowed to
stop being naive — and only against a benchmark that proves the array sort is the bottleneck.

- [ ] Benchmark first. Record p50/p99 before changing any data structure.
- [ ] Replace array-sorted price levels with a sorted structure *if the benchmark justifies it*.
- [ ] Load test: concurrent order flow plus rapid index price updates, hunting margin-check races.
- [ ] Immutable audit log of every order, fill, and liquidation.
- [ ] Latency + throughput metrics, alerting on anomalies.

**Gate:** measured p50/p99 numbers written down in this repo. No invented numbers.

---

## Rung 5 — BEST  *(Day 6–7)*

**Goal:** solvent under a gap, and alive without supervision.

- [ ] Insurance fund collecting liquidation penalties; absorbs bankruptcy deficits.
- [ ] Auto-Deleveraging when the fund drains — queue by leverage and unrealised profit.
- [ ] Cross margin.
- [ ] Maker/taker fee tiers.
- [ ] Market-making bots quoting around mark price; trader bots generating flow.
- [ ] Containerised deploy, live URL, demo accounts.
- [ ] Move auth to `HttpOnly; Secure; SameSite` cookies with CSRF protection, so the browser
      stops holding a JWT in `localStorage`.

**Gate:** the full stack runs for an hour with bots trading and no manual intervention.

---

## Parked

Things deliberately not being done, so they stop being re-litigated.

- Go/Rust port of the engine — DECISION-002, revisit only if TS is the proven bottleneck.
- Red-black tree orderbook — Rung 4, and only against a benchmark.
- Multi-collateral — not on the ladder at all yet.
