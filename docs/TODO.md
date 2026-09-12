# Build Plan: Climbing the Quality Ladder

Breadth-first. Every component reaches a rung before any component climbs to the next one.
See DECISION-006 for why, and `PROJECT_ROADMAP.md` for the ladder definition and the current
per-component status table.

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

## Rung 1 — OK  *(Day 1 — current)*

**Goal:** an ugly end-to-end exchange. Place an order in a browser, watch it match, watch a
position get liquidated off a mark price that is not our own last traded price. Every number
can be wrong. Nothing may be missing.

**Fakes are allowed and encouraged at this rung:** mark price = a number that ticks on a timer,
persistence = a JSON file, funding = every 10 seconds instead of every 8 hours, no Kafka at all
(direct function calls). Swap the fakes for real infrastructure at BETTER, not now.

### Engine — split the god class
- [x] `isLiquidatable()` in `risk/risk.ts` — equity vs maintenance margin.
- [x] `liquidationChecks()` in `core/engine.ts` — collect-then-liquidate.
- [ ] `core/Ledger.ts` — `lockMargin`, `unlockMargin`, `updatePosition`, `settlePnL`.
      Move the inline margin math out of `engine.ts`; keep the known bugs, just relocate them.
- [ ] `core/MatchingEngine.ts` — `createMarket`, `processOrder` routing to the right `Orderbook`.
      No margin or collateral logic in here.
- [ ] `risk/RiskManager.ts` — `checkLiquidations` using `ledger` + `matchingEngine` instead of
      reaching into maps directly.
- [ ] `core/Exchange.ts` — `placeOrder`: lock margin → match → update both sides per fill.
- [ ] Delete `core/engine.ts` once `Exchange` covers it.

### Everything else to "it runs"
- [ ] `apps/mark-price-poller` — emit a price on a timer. Hardcoded walk is fine; no Binance yet.
- [ ] Funding — a function that pays longs from shorts (or the reverse) on a short interval.
- [ ] `apps/server` — call the engine directly from the order route. No Kafka.
- [ ] `apps/db-writer` — dump fills and positions to a JSON file on an interval.
- [ ] `apps/ws` — broadcast orderbook + fills to any connected client. No auth, no channels.
- [ ] `apps/web` — one page: order form, orderbook list, positions list, all live over the WS.

**Gate:** `bun apps/engine/tests/test.engine.ts` runs the modular classes end to end with no
negative balances, and the browser page shows a real fill.

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

**Gate:** the full stack runs for an hour with bots trading and no manual intervention.

---

## Parked

Things deliberately not being done, so they stop being re-litigated.

- Go/Rust port of the engine — DECISION-002, revisit only if TS is the proven bottleneck.
- Red-black tree orderbook — Rung 4, and only against a benchmark.
- Multi-collateral — not on the ladder at all yet.
