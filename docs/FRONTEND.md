# Frontend Architecture & Build Plan

The trading terminal. This is the frontend counterpart to `TODO.md` — same five rungs, same
days, same rule: **build every piece badly before improving any piece** (DECISION-006).

The thing worth building here is not "React plus a chart". It is a **market-data
architecture**: high-frequency data kept out of React, normalized in a dedicated layer, with
components subscribing only to the slice they render.

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

## Tech stack (locked)

| Layer | Choice | Installed | Notes |
| :--- | :--- | :--- | :--- |
| Build | Vite | **8.0** | Plan said 7.x; repo is on 8. Keep 8. |
| Framework | React | 19.2 | `useOptimistic`, `useActionState`, `useFormStatus`, `use()` |
| Language | TypeScript | **6.0** | Plan said 5.x; repo is on 6. `strict` is **off** — fix at GOOD. |
| Styling | Tailwind CSS | 4.3 | CSS-first `@theme`, no `tailwind.config.js` |
| UI primitives | shadcn/ui | — | `radix-ui` 1.4 already installed; `shadcn` CLI is in the wrong section |
| Icons | Lucide React | — | to add; remove `@hugeicons` when it lands |
| Animation | Motion | — | to add at AWESOME |
| Client state | Zustand | 5.0 | orderbook, ticker, UI, connection |
| Server state | TanStack Query | 5.100 | REST only, never live data |
| Forms | React Hook Form | 7.76 | |
| Validation | Zod | — | 4.x, to add at GOOD. Schema-first. |
| Financial math | Decimal.js | — | 10.x, to add at GOOD. Never `number` for price or size. |
| Charts | KLineChart | — | 10.0.3, Apache 2.0, ~40KB, zero deps |
| Realtime | native WebSocket | — | no library |
| Heavy processing | Web Workers | — | AWESOME rung, gated on profiling |
| Local storage | Dexie (IndexedDB) | — | 4.x, BETTER rung, once there is data worth caching |
| HTTP | `fetch` | — | drop the unused `axios` dependency |
| Testing | Vitest + RTL + Playwright | — | Vitest/RTL at GOOD, Playwright at BEST |

### Corrections to the spec

* **Vite 8 and TypeScript 6 are installed**, not 7.x and 5.x. Don't downgrade to match a doc.
* **`strict` and `noUncheckedIndexedAccess` are not enabled** in `apps/web/tsconfig.app.json`
  today. The spec assumes both. Turning them on is a GOOD-rung task and will surface errors.
* **`shadcn` sits in `dependencies`** but is a CLI — move it to devDependencies.
* **`axios` is installed and unused** — remove it rather than keep a third HTTP story.
* **Two icon packs.** `@hugeicons` is installed; the spec locks Lucide. Pick Lucide, delete
  hugeicons in the same commit. Do not ship both.
* **No `wagmi`/`viem`.** This perp is not on-chain — it is a centralized engine with JWT auth
  and an in-process matching engine. There is no wallet to connect, no EIP-712 order to sign.

---

## Where the frontend stands today

At the **OK** rung, and honestly so. `apps/web/src/pages/TradingPage.tsx` is one component
that polls `/api/depth` and `/api/positions` on a 1s `setInterval`, holds a raw WebSocket in a
`useEffect`, and re-renders the whole page on every message. That is the demo shape the OK rung
permits, and it is what Rungs 2–4 dismantle.

---

## Backend prerequisites

Most of this plan is **blocked on the engine, not on React**. Listing it here so the two plans
stay honest. A frontend rung cannot land before its backend row.

| Frontend need | Backend today | Gap |
| :--- | :--- | :--- |
| **Candlestick chart** | no candle storage, no route | **KLineChart has nothing to load. The entire chart section is blocked.** |
| Live orderbook | broadcasts `fill`, `index`, `funding`, `liquidation` | no depth events; UI must keep polling |
| Sequence / resync | no sequence numbers | cannot detect a dropped message |
| Channels | one firehose to every client | no `SUBSCRIBE`, no private per-user channels |
| Trade feed backfill | live fills only | feed is empty on page load |
| Order history (paginated) | not stored | no infinite query, nothing to virtualize |
| Open orders panel | tracks positions, not resting orders | cannot list or cancel an order |
| Watchlist / multi-symbol | one market exists (`BTC-PERP`) | nothing to watch or switch between |
| Funding rate display | emits payments, not the rate | no rate, no countdown |
| 24h change / ticker | not computed | header stats have no source |
| Cookie auth | returns a JWT for the `token` header | `localStorage` token stays until BEST |

**Read this before starting a UI day.** Building the chart panel before `/candles` exists means
building against a mock you then throw away.

---

# The build plan

## Rung 1 — OK  *(Day 1 — done)*

- [x] One page: token field, deposit, order form, depth, positions, live event log.
- [x] Reads the real REST API and the real WebSocket feed.

Polling, one component, full re-render. All deliberate.

---

## Rung 2 — GOOD  *(Day 2)*

**Goal:** right shape, right numbers, right types. Still single-threaded, still unoptimised.

### Foundation
- [ ] Enable `"strict": true` and `"noUncheckedIndexedAccess": true` in `tsconfig.app.json`,
      then fix the fallout. Everything below assumes them.
- [ ] Adopt the folder structure (below). Move `TradingPage` into `features/trade`.
- [ ] Dependency cleanup: add `zod`, `decimal.js`, `lucide-react`, `vitest`,
      `@testing-library/react`; remove `axios` and `@hugeicons/*`; move `shadcn` to devDeps.
- [ ] `shadcn/ui` init. Tailwind v4 `@theme` tokens in `src/index.css` (below).

### Shell and layout
- [ ] `AppShell` = Sidebar + Header + Main. Routes: Trade, Positions, History, Deposit, Settings.
- [ ] `QueryProvider` and `ThemeProvider`.
- [ ] `font-variant-numeric: tabular-nums` on every price so digits stop jumping.

### State and data
- [ ] Four Zustand stores: `ui`, `market`, `account`, `connection`.
- [ ] `shared/hooks/useWebSocket` — lifecycle, exponential-backoff reconnect, 30s heartbeat,
      message routing by `type`. Out of the component, once, reused.
- [ ] `shared/lib/decimal.ts` + `formatters.ts`. Every preview calculation — notional, margin,
      estimated liquidation, PnL — goes through Decimal. The backend stays authoritative.
- [ ] Typed API clients per resource in `features/*/api/`, responses parsed with Zod.

### Order ticket
- [ ] React Hook Form + Zod resolver, `useActionState` for submit, `useFormStatus` for the button.
- [ ] Explicit rejections: "Insufficient margin — available $412.20, required $523.50".
      Never "Something went wrong".

### Tests
- [ ] Vitest + RTL on the pure functions: margin, liquidation preview, fee estimate,
      decimal formatting, orderbook aggregation.

**Gate:** `strict` on and compiling, no `setInterval` polling for depth (needs the backend depth
broadcast), order rejections show a real reason, calc unit tests pass.

---

## Rung 3 — BETTER  *(Day 3–4)*

**Goal:** the data pipeline survives a dropped packet and a reconnect. This is the rung that
makes it a trading app rather than a dashboard.

- [ ] Subscription manager: `ticker:BTC-PERP`, `orderbook:BTC-PERP:depth=50`,
      `trades:BTC-PERP`, `candles:BTC-PERP:1m`, `positions:user`, `orders:user`.
- [ ] Sequence validation on every book update; on a gap, snapshot and resync:
      ```ts
      if (message.sequence !== lastSequence + 1) requestSnapshot()
      ```
- [ ] Connection state machine: `connecting | connected | reconnecting | disconnected | resyncing`.
      Latency indicator and system-status panel.
- [ ] Fine-grained selectors so a bid change does not repaint the ticker:
      ```ts
      const bids = useMarketStore(s => s.orderbook.bids)
      const bestAsk = useMarketStore(s => s.orderbook.bestAsk)
      ```
- [ ] `useOptimistic` order lifecycle: `Submitting → Accepted → Filled / Rejected`.
      Never render `Filled` before the server says so.
- [ ] TanStack Query for REST server state; infinite query for order history.
- [ ] Dexie for settings and watchlist persistence. UI preferences only — never a token.
- [ ] Positions, History, Deposit, Settings pages built out.
- [ ] **Chart, once `/candles` exists** — KLineChart with `setDataLoader` (below).
- [ ] Orderbook row price-change flash in **CSS**, not Motion.

**Gate:** kill the WebSocket mid-session; the book resyncs and no stale or corrupted depth is
ever displayed.

---

## Rung 4 — AWESOME  *(Day 5)*

**Goal:** fast under real message rates. **Every item is gated on profiling** — the same pull
rule as the orderbook tree in `TODO.md`. Measure, then move.

- [ ] Profile and write the numbers down before changing anything.
- [ ] Throttle *rendering*, not market data: process every message in the engine, paint on
      `requestAnimationFrame` at ~60fps.
- [ ] `React.memo` on `OrderRow`, `useMemo` on PnL and sorted lists, `useCallback` on handlers
      passed to memoized children — where the profile says so, not everywhere.
- [ ] `useTransition` for the positions search filter so the chart stays at 60fps.
- [ ] Route and component lazy loading; preload on nav hover.
- [ ] `@tanstack/react-virtual` for order history (needs the history endpoint).
- [ ] **Web Worker for orderbook merge — only if profiling justifies it.** At the spec's own
      numbers (100 levels × 2 at 10 updates/sec) a worker is not warranted. One market and a
      human clicking will not justify it; several live symbols will.
- [ ] Dexie candle cache for instant chart load.
- [ ] Motion: position list enter/exit, order-fill toast, modal slide-up, page transitions.

**Gate:** measured frame timings written down in this repo. No invented numbers.

---

## Rung 5 — BEST  *(Day 6–7)*

- [ ] Playwright E2E: sign in → deposit → place order → receive fill → position appears → close.
- [ ] Sentry plus custom metrics: WS RTT, market-data staleness, click→ACK, click→fill,
      reconnect count.
- [ ] Move auth off `localStorage` to `HttpOnly; Secure; SameSite` cookies with CSRF protection.
      Requires the backend auth change. **This supersedes the "auth token in Zustand +
      localStorage" row in the ownership map** — that is the OK-through-AWESOME shape only.
- [ ] Strict CSP — no `unsafe-inline`, no `unsafe-eval`. HTTPS and WSS only in production.
- [ ] Command palette (⌘K): search markets, jump to views, quick actions.
- [ ] `useKeyboardShortcut`: 1 = market buy, 2 = limit, Esc = close modal, Ctrl+Enter = submit.
      Must not fire while an input or textarea is focused.
- [ ] A separate mobile layout — chart, side toggle, order form, positions; orderbook as a
      swipe panel. Not a shrunk desktop.

---

# Reference

## Project structure

Adopted at the GOOD rung.

```
src/
├── app/
│   ├── layout/        AppShell, Sidebar, Header
│   ├── routes/        TradePage, PositionsPage, HistoryPage, DepositPage, SettingsPage
│   └── providers/     QueryProvider, ThemeProvider
├── features/
│   ├── trade/
│   │   ├── components/   ChartPanel, OrderBook, OrderTicket, Watchlist
│   │   ├── hooks/        useOrderBook, useCandles, usePlaceOrder
│   │   ├── store/        tradeStore.ts
│   │   ├── api/          tradeApi.ts
│   │   └── types.ts
│   ├── positions/        components/ hooks/ store/
│   ├── wallet/           components/ hooks/
│   └── settings/         components/ store/
├── shared/
│   ├── components/    shadcn/ui primitives
│   ├── hooks/         useWebSocket, useDebounce, useKeyboardShortcut, useMediaQuery, useInterval
│   ├── lib/           decimal.ts, formatters.ts, utils.ts
│   └── types/         order.ts, position.ts, candle.ts
└── workers/           orderBook.worker.ts, indicator.worker.ts
```

Each feature owns its own `components/`, `hooks/`, `store/`, `api/`. This is deliberately not
`components/ services/ utils/` — those three become 300-file dumping grounds.

## State ownership

| State | Where | Why |
| :--- | :--- | :--- |
| Orderbook (100 levels × 2) | Zustand, fed by WS | many readers, high frequency |
| Ticker / mark price | Zustand | shared by header, chart, ticket |
| Open positions | TanStack Query + Zustand optimistic overlay | server is truth; overlay is instant |
| Order form fields | React Hook Form | multi-field with validation |
| Selected symbol / interval | Zustand (ui) | shared by chart, ticket, watchlist |
| Chart instance / crosshair | `useRef` | imperative, must not re-render |
| Modal open/close | `useState` | purely local |
| User settings | Zustand + Dexie | survives reload |
| Auth token | Zustand + localStorage → **cookie at BEST** | global, rarely changes |
| Order history | TanStack Query infinite | server-paginated |
| Watchlist | Zustand + Dexie | offline preference |

**Golden rule**

```
Server data  →  TanStack Query
UI state     →  Zustand (global) or useState (local)
Form state   →  React Hook Form
Async ops    →  useActionState + useOptimistic
Imperative   →  useRef
```

Never put server data in Zustand. Never put form state in a global store.

The positions row looks like an exception; it is not. Query owns the truth. Zustand holds only
the optimistic overlay, and that overlay is discarded on the next successful fetch — it is UI
state about an in-flight action, not a second copy of server state.

## Hooks map

| Hook | Used for |
| :--- | :--- |
| `useState` | modal open, selected tab, search input |
| `useReducer` | order form when it outgrows RHF field state |
| `useRef` | WebSocket, chart instance, animation frame id |
| `useImperativeHandle` | expose `zoomTo` / crosshair on the chart |
| `useMemo` | PnL, sorted positions, filtered history |
| `useCallback` | handlers passed to memoized children |
| `useEffect` | WS connect/disconnect, chart init/destroy, shortcuts, resize |
| `useLayoutEffect` | chart canvas sizing — measure before paint |
| `useTransition` | positions search filter, to protect chart framerate |
| `useContext` | theme, locale, auth user |
| `useOptimistic` | order placement — instant pending, rollback on reject |
| `useActionState` | order submit — pending/error/success without three `useState` |
| `useFormStatus` | submit button spinner, no prop drilling |
| `use()` | read a promise in render |

Custom: `useWebSocket`, `useOrderBook`, `useCandles`, `usePosition`, `useDebounce`,
`useKeyboardShortcut`, `useMediaQuery`, `useInterval`.

## WebSocket architecture

```
useWebSocket  — connect/disconnect/reconnect (exp backoff), 30s heartbeat, route by `type`
      │
      ├── candle updates  →  chart.applyNewData()
      ├── orderbook       →  Zustand .updateBook()
      └── trade / fill    →  Query .invalidate()
```

The GOOD-rung hook is roughly:

```ts
export function useWebSocket(url: string, onMessage: (data: unknown) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => { retryRef.current = 0; };
      ws.onmessage = e => onMessage(JSON.parse(e.data));
      ws.onclose = () => {
        timeout = setTimeout(connect, Math.min(1000 * 2 ** retryRef.current++, 30000));
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => { clearTimeout(timeout); wsRef.current?.close(); };
  }, [url]);
}
```

At BETTER this grows a subscription manager and sequence checking and moves out of `shared/hooks`
into a proper `realtime/` layer. Don't build that on Day 2.

## Chart — KLineChart v10

**Blocked until the backend serves candles.** Nothing below is buildable before then.

What v10 gives you without writing it yourself:

* multiple y-axes per pane — price and volume on separate scales
* `setDataLoader` — one API covering historical, realtime and backward paging
* custom hotkeys via `setHotkey` / `registerHotkey`
* zoom anchored to the crosshair rather than the viewport centre
* continuous drawing mode and a built-in brush overlay
* auto-resize — it observes the container, so no manual `resize()` on window change
* inertial scrolling on touch

```tsx
const chart = init(containerRef.current, {
  styles: {
    grid: { show: false },
    candle: { bar: { upColor: '#22c55e', downColor: '#ef4444', unchangedColor: '#6b7280' } },
  },
});

chart.setDataLoader({
  getBars: async (symbol, period, callback, type) => {
    callback(await fetchCandles(symbol, period, type)); // type: init | forward | backward
  },
});

chart.setSymbol(symbol);
chart.setPeriod(interval);

chart.createIndicator({ name: 'MA', calcParams: [7, 25, 99] });
chart.createIndicator({ name: 'MACD', isStack: true });
chart.createIndicator({ name: 'RSI', isStack: true, calcParams: [14] });
chart.createIndicator({ name: 'BOLL', calcParams: [20, 2] });
```

Live candles arrive over the same WebSocket. `setDataLoader`'s `forward` type covers this, or
push directly:

```ts
if (msg.type === 'candle') {
  chartRef.current?.applyNewData([msg.candle]);
}
```

Hold the chart in a `useRef` and tear it down in the effect cleanup — it is imperative and must
never drive a re-render.

> Verify these signatures against the KLineChart v10 docs when you implement. The snippet comes
> from the plan, not from code we have run.

## Animation — Motion

| Element | Animation |
| :--- | :--- |
| Position list | `AnimatePresence` + `layout`, enter/exit |
| Order fill toast | spring scale + opacity |
| Order ticket modal | `AnimatePresence` + slide up |
| Watchlist reorder | `layout` + drag gesture |
| Page transitions | fade/slide |

```tsx
<AnimatePresence mode="popLayout">
  {positions.map(p => (
    <motion.div
      key={p.id}
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="px-4 py-2 border-b border-white/5"
    >
      {p.symbol} — {p.pnl}
    </motion.div>
  ))}
</AnimatePresence>
```

**Do not animate with Motion:** orderbook rows (use a CSS `background-color: 100ms` transition —
they update ~100×/sec), the chart (KLineChart renders itself), or any number that changes every
tick.

## Tailwind v4 theme

`src/index.css`. CSS-first — no `tailwind.config.js`.

```css
@import "tailwindcss";

@theme {
  --color-profit: #22c55e;
  --color-loss: #ef4444;
  --color-bg-primary: #0a0a0f;
  --color-bg-card: #12121a;
  --color-bg-elevated: #1a1a2e;
  --color-border-subtle: rgba(255, 255, 255, 0.05);
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --font-mono: 'JetBrains Mono', monospace;
}

@utility scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: var(--color-text-secondary) transparent;
}
```

Dark, muted, green long / red short / amber warning. The numbers should dominate, not the chrome.

## Lazy loading

**Routes — the biggest win.** All five behind `lazy()` + `Suspense`.

```tsx
const TradePage     = lazy(() => import('./routes/TradePage'));
const PositionsPage = lazy(() => import('./routes/PositionsPage'));
const HistoryPage   = lazy(() => import('./routes/HistoryPage'));
const DepositPage   = lazy(() => import('./routes/DepositPage'));
const SettingsPage  = lazy(() => import('./routes/SettingsPage'));
```

**Components.** `ChartPanel`, `OrderTicket`, `IndicatorPanel`.

**Libraries, on demand.** Pull a heavy dependency only when the action fires:

```ts
async function exportCSV() {
  const { toCSV } = await import('json2csv');
}
```

**Preload on hover** so the chunk is warm before the click:

```tsx
<NavLink to="/positions" onMouseEnter={() => import('./routes/PositionsPage')}>
```

| Do not lazy-load | Why |
| :--- | :--- |
| Header, sidebar, layout shell | always visible, tiny |
| `useWebSocket` | needed immediately |
| Zustand stores | must exist before first render |
| Anything under ~10KB | the extra request costs more than the bytes saved |

## Performance strategy

The techniques and where each one belongs. All of these land at the AWESOME rung and all are
gated on a profile first — this table is the menu, not the order.

| Technique | Where |
| :--- | :--- |
| `React.memo` | `OrderRow` — 100+ rows updating every 100ms |
| `useMemo` | PnL, sorted positions, filtered lists |
| `useCallback` | handlers passed to memoized children |
| `useTransition` | positions search filter, to protect chart framerate |
| Web Workers | orderbook computation, indicator math |
| Virtualized lists | order history at 1000+ rows — `@tanstack/react-virtual` |
| Lazy loading | routes, chart, order ticket |
| Preload on hover | nav prefetches the next route |
| Dexie | cache the last 1000 candles per symbol for instant load |

The worker keeps the merge off the main thread:

```ts
// workers/orderBook.worker.ts
self.onmessage = ({ data: { bids, asks } }) => {
  self.postMessage(computeBookLevels(bids, asks));
};
```

```ts
useEffect(() => {
  workerRef.current = new Worker(new URL('../../workers/orderBook.worker.ts', import.meta.url));
  workerRef.current.onmessage = ({ data }) => {
    useTradeStore.getState().setOrderBook(data);
  };
  return () => workerRef.current?.terminate();
}, []);
```

Note the store write goes through `getState()`, not a hook — the worker callback is outside
React's render cycle and must not subscribe.

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

## Components that deserve optimisation

Everything else can be ordinary React. These repaint at market speed:

`PriceTicker` · `OrderBook` · `TradeFeed` · `ChartPanel` · `PositionRow` · `PnL` ·
`MarginIndicator` · `LiquidationPrice` · `OrderTicket`

## Parked

* Canvas rendering — only against a profile that proves DOM is the bottleneck.
* Multi-symbol live subscriptions — the Web Worker only earns its place once this exists.
* On-chain wallet flow — out of scope while the exchange is centralized.
* Leaderboard, analytics, social features — not on the ladder.
