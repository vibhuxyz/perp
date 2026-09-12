# Frontend Architecture & Build Plan

The trading terminal. This doc is the frontend equivalent of `TODO.md` — same five rungs,
same days, same rule: **build every piece badly before improving any piece**
(DECISION-006). The target is a Hyperliquid/Bybit-class terminal, but we get there one rung
at a time, not in one heroic sprint.

The thing worth building here is not "React plus a chart". It is a **market-data
architecture**: high-frequency data kept out of React, normalized and sequence-checked in a
dedicated layer, with components subscribing only to the slice they render.

---

## Target architecture

```
                 ┌──────────────────────────────┐
                 │           React UI            │
                 │  Orderbook / Trades / Chart   │
                 └──────────────┬───────────────┘
                                │  selective subscriptions
        ┌───────────────────────▼────────────────────────┐
        │                 Trading State                   │
        │   uiStore   marketStore   accountStore          │
        │             connectionStore                     │
        └───────────────────────┬────────────────────────┘
                                │  immutable UI snapshots
              ┌─────────────────▼──────────────────┐
              │        Market Data Engine           │
              │  normalize · aggregate · sequence   │
              │  reconnect · backoff · heartbeat    │
              └─────────────────┬──────────────────┘
                                │
                          Web Worker
                                │
        ┌───────────────────────▼────────────────────────┐
        │  orderbook merge · trades · candles · throttle  │
        └────────────────────────────────────────────────┘
```

The load-bearing idea: **the WebSocket feeds an engine, not a component.** React never sees a
raw message. The engine keeps the authoritative book and publishes small snapshots; each
component subscribes to the narrowest selector it can.

---

## Where the frontend stands today

At the **OK** rung, and honestly so. `apps/web/src/pages/TradingPage.tsx` is one component
that polls `/api/depth` and `/api/positions` on a 1s `setInterval`, holds a raw WebSocket in a
`useEffect`, and re-renders the whole page on every message. That is the demo shape the OK rung
explicitly permits, and it is what Rungs 2–4 dismantle.

---

## Backend prerequisites

Several frontend items are **blocked on the engine side**, not on React. Listing them here so
the two plans stay honest with each other — a frontend rung cannot land before its backend row.

| Frontend need | What the backend does today | Gap |
| :--- | :--- | :--- |
| Live orderbook | broadcasts `fill`, `index`, `funding`, `liquidation` | no depth events at all; UI must poll `/api/depth` |
| Sequence / resync | no sequence numbers anywhere | cannot detect a dropped message |
| Channels | one firehose to every client | no `SUBSCRIBE` protocol, no per-user channels |
| Candlestick chart | no candle storage, no `/candles` route | chart has nothing to load |
| Trade feed history | fills broadcast live only | no `/trades` backfill on page load |
| Funding rate display | emits payments, not the rate | no current rate or next-funding countdown |
| Open orders panel | engine tracks positions, not resting orders per user | cannot list or cancel an order |
| 24h change, ticker | not computed | header stats have no source |
| Cookie auth | returns a JWT for the `token` header | `localStorage` token stays until this changes |

Each of these is a row in the backend plan too. Do not fake them in the UI beyond the OK rung.

---

## Rung 1 — OK  *(Day 1 — done)*

- [x] One page: token field, deposit, order form, depth, positions, live event log.
- [x] Reads the real REST API and the real WebSocket feed.

Polling, one component, full re-render. All deliberate.

---

## Rung 2 — GOOD  *(Day 2)*

**Goal:** the right shape and correct numbers. Still single-threaded, still unoptimised.

### Structure
- [ ] Adopt the feature-folder layout (below). Move `TradingPage` into `features/trading`.
- [ ] Split Zustand into four stores: `ui`, `market`, `account`, `connection`.
- [ ] Move the WebSocket out of the component into `realtime/` — connection manager,
      message router, reconnect with exponential backoff, heartbeat.
- [ ] Typed API clients in `api/`, one file per resource, responses validated with Zod.

### Correctness
- [ ] `decimal.js` for every preview calculation — notional, margin, estimated liquidation,
      PnL preview. Never floats. The backend stays authoritative; these are display only.
- [ ] Order form on React Hook Form + Zod, with local validation before submit.
- [ ] Explicit error states. "Order rejected — insufficient margin, available $412.20,
      required $523.50", never "Something went wrong".

### Layout
- [ ] The real terminal grid: header ticker, chart area, orderbook, trades, order panel,
      bottom tabs (Positions / Open Orders / History).
- [ ] Tailwind + Radix primitives. Dark, muted, green long / red short / amber warning.
- [ ] `font-variant-numeric: tabular-nums` on every price so digits stop jumping.

### Tests
- [ ] Vitest + React Testing Library on the pure functions: margin, liquidation preview,
      fee estimate, decimal formatting, orderbook aggregation.

**Gate:** no `setInterval` polling for depth (requires the backend depth broadcast), order
rejections show a real reason, and the calc unit tests pass.

---

## Rung 3 — BETTER  *(Day 3–4)*

**Goal:** the data pipeline survives a dropped packet and a reconnect. This is the rung that
makes it a trading app rather than a dashboard.

- [ ] Subscription manager: `ticker:BTC-PERP`, `orderbook:BTC-PERP:depth=50`,
      `trades:BTC-PERP`, `candles:BTC-PERP:1m`, `positions:user`, `orders:user`.
- [ ] Sequence validation on every book update. On a gap, request a snapshot and resync:
      ```
      if (message.sequence !== lastSequence + 1) requestSnapshot()
      ```
- [ ] Connection state machine: `connecting | connected | reconnecting | disconnected | resyncing`.
- [ ] Fine-grained selectors so a bid change does not repaint the ticker:
      ```ts
      const bids = useMarketStore(s => s.orderbook.bids)
      const bestAsk = useMarketStore(s => s.orderbook.bestAsk)
      ```
- [ ] Optimistic order lifecycle: `Submitting → Accepted → Filled / Rejected`.
      Never render `Filled` before the server says so.
- [ ] TanStack Query for REST server state only — markets, candles history, funding history,
      trade history. Live data never goes through Query.
- [ ] Latency indicator and a system-status panel (market data / trading API / WS RTT).
- [ ] Persist UI preferences only: symbol, timeframe, layout, theme. Nothing sensitive.

**Gate:** kill the WebSocket mid-session; the book resyncs and no stale or corrupted depth is
ever displayed.

---

## Rung 4 — AWESOME  *(Day 5)*

**Goal:** fast under real message rates. **Every item here is gated on profiling** — the same
pull rule as the orderbook tree in `TODO.md`. Measure first, then move.

- [ ] Profile and record numbers before changing anything.
- [ ] Throttle *rendering*, not market data: process every message in the engine, paint on
      `requestAnimationFrame` at ~60fps.
- [ ] Move orderbook merge, sorting, aggregation and candle rollup into a Web Worker
      **if** the main thread is measurably blocked. One market and a human clicking will not
      justify this; several live symbols will.
- [ ] Lightweight Charts with incremental `series.update()`. Never re-`setData()` per tick.
- [ ] Render 20–50 visible levels while the engine keeps the full book internally.
- [ ] Code splitting: lazy-load portfolio, history, settings, analytics.
- [ ] Canvas only where DOM profiling proves the bottleneck. Not before.

**Gate:** measured frame timings written down in this repo. No invented numbers.

---

## Rung 5 — BEST  *(Day 6–7)*

- [ ] Playwright E2E: sign in → deposit → place order → receive fill → position appears → close.
- [ ] Sentry plus custom metrics: WS RTT, market-data staleness, click→ACK, click→fill,
      reconnect count.
- [ ] Move auth off `localStorage` to `HttpOnly; Secure; SameSite` cookies, with CSRF
      protection on state-changing requests. Requires the backend auth change.
- [ ] Strict CSP — no `unsafe-inline`, no `unsafe-eval`. HTTPS and WSS only in production.
- [ ] Command palette (⌘K): search markets, jump to views, quick actions.
- [ ] Keyboard shortcuts — B/S side, M/L type, ↑↓ size, Ctrl+Enter submit, Esc cancel.
      Must not fire while an input is focused.
- [ ] A separate mobile layout — chart, side toggle, order form, positions; orderbook as a
      swipe panel. Not a shrunk desktop.

---

## Stack

Already installed in `apps/web` and staying: React 19, TypeScript, Vite, Tailwind, Radix,
Zustand, TanStack Query, React Hook Form, `clsx`, `tailwind-merge`, React Router.

To add, at the rung that needs it:

| Package | Rung | For |
| :--- | :--- | :--- |
| `zod` | GOOD | response + form validation |
| `decimal.js` | GOOD | exact preview arithmetic |
| `vitest`, `@testing-library/react` | GOOD | unit tests |
| `lightweight-charts` | AWESOME | candlesticks with incremental updates |
| `playwright` | BEST | E2E |
| `@sentry/react` | BEST | error and metric reporting |

### Deviations from the proposed stack, and why

* **bun, not pnpm.** The repo is a bun workspace with a `bun.lock`. A second package manager
  buys nothing and breaks the lockfile.
* **No `wagmi` / `viem`.** This perp is not on-chain. It is a centralized engine with JWT auth
  and an in-process matching engine — there is no wallet to connect and no EIP-712 order to
  sign. Revisit only if the settlement layer moves on-chain.
* **No Dexie.** `localStorage` covers theme, symbol and layout. IndexedDB is for data we do
  not have.
* **Keep `@hugeicons`, do not add `lucide-react`.** One icon pack. The existing one works.
* **Native `fetch`, not `axios`/`ky`.** `axios` is already a dependency and currently unused;
  drop it rather than adding a third HTTP story.
* **`shadcn` is listed as a dependency but is a CLI.** It belongs in devDependencies or nowhere.

---

## Standing rules

Architectural, not stylistic. These hold at every rung.

**Never**
* `setInterval` or REST polling for live prices (past the OK rung)
* the live orderbook in React Context
* replacing the whole book on every tick
* floating-point money math anywhere
* `useState` fed directly by `ws.onmessage`
* private keys, session secrets or API secrets in any browser storage
* rendering hundreds of constantly-changing rows
* trusting a frontend calculation for anything that settles

**Always**
* WebSocket transport with selective subscriptions
* incremental book updates behind a sequence check
* decimal arithmetic for money
* immutable snapshots from engine to store
* the narrowest possible selector per component

---

## Folder structure

Adopted at the GOOD rung.

```
src/
├── app/            router, providers, config
├── components/     ui/ primitives, common/ shared
├── features/
│   ├── market/     ticker, header stats
│   ├── orderbook/
│   ├── chart/
│   ├── trading/    order panel
│   ├── positions/
│   ├── orders/
│   └── portfolio/
├── realtime/       websocket, connection, subscriptions, protocol
├── workers/        market.worker, orderbook.worker   (AWESOME rung)
├── stores/         ui, market, account, connection
├── api/            client + one file per resource
├── lib/            decimal, formatting, logger, validation
└── types/          market, order, position, websocket
```

Each feature owns its `components/`, `hooks/`, `store/` and `utils/`. This is deliberately not
`components/ services/ utils/` — those three folders become 300-file dumping grounds.

---

## Components that deserve optimisation

Everything else can be ordinary React. These are the ones that repaint at market speed:

`PriceTicker` · `OrderBook` · `TradeFeed` · `CandlesChart` · `PositionRow` · `PnL` ·
`MarginIndicator` · `LiquidationPrice` · `OrderForm`

---

## Parked

* Canvas rendering — AWESOME rung, and only against a profile.
* Multi-symbol live subscriptions — the Web Worker only earns its place once this exists.
* On-chain wallet flow — out of scope while the exchange is centralized.
* Leaderboard, analytics, social features — not on the ladder.
