# Session 10: Raising the Bar to Production Level
**Date:** 2026-09-08

## Goal of the Session
Re-plan the project against a **production-level** target instead of an MVP target, and catch the
docs up to the code again.

## State Found at Session Start (code, not docs)
The engine moved ahead of the docs a second time. `apps/engine/src` now also contains:

* `config.ts` — `MAINTENANCE_MARGIN_RATIO = 2n`, `MMR_SCALE = 100n` (2% MMR), stored as
  integer + scale so the ratio survives `bigint` math with no floats.
* `risk.ts` — `positionEquity()` (margin + unrealised PnL) and `maintenanceMargin()`
  (notional * MMR / scale) are implemented. **`isLiquidatable()` is an empty stub** — it has the
  TODO comment and no `return`, so it currently returns `undefined`.
* `index.ts` — `liquidationChecks()` is now TODO comments only (the old `console.log` version is
  gone). The comments correctly note the trap: don't liquidate while iterating `userPositions`,
  because `liquidatePosition()` rebuilds that list.
* `test.engine.ts` (197 lines) replaced the old `test.ts` scratch file.

Other workspaces are scaffolds only: `apps/mark-price-poller`, `apps/ws`, `apps/db-writer` are
empty or print "Hello via Bun!". `apps/web` has the Vite/React skeleton. Everything is still
uncommitted past `850b3a2`.

## What We Did
* Recorded the scope change as **DECISION-004** (MVP -> production level) and **DECISION-005**
  (test-suite gate moves earlier, now blocking the WAL work, not just Phase 4).
* Rewrote `PROJECT_ROADMAP.md` around a **Production Priority Stack** (P1-P7) and re-tagged every
  phase with the priority that drives it.
* Rewrote `TODO.md` in that priority order.
* Added the new concepts to `LEARNING_LOG.md` (funding rate, mark vs index price, WAL/event
  sourcing, idempotency, insurance fund, ADL, load-testing races).

## The Production Priority Stack (why this order)
1. **Liquidation, funding, mark price** — the perp mechanics *are* the product.
2. **Crash-safe state (WAL / event log)** — in-memory means a restart currently loses everything.
3. **Financial correctness & idempotency** — integers only, no double-credits, reconciliation.
4. **Insurance fund / bankruptcy** — a price gap can insolvent the exchange without one.
5. **Load testing** — prove the latency numbers; margin-check races hide there.
6. **Observability & audit trail** — immutable log of every order, fill, liquidation.
7. **Deploy with seeded bot activity** — so the book isn't empty on first open.

Each layer assumes the one above it is correct. Building #7 on a broken #1 just means an
audience watches the bug.

## Open Issues Carried Forward (from Session 09, still unfixed)
* `liquidationChecks()` never calls `liquidatePosition()` — the loop is still open.
* `processOrder()` only unlocks margin for the taker, not the maker.
* `liquidatePosition()` runs the closing MARKET order but **ignores the resulting fills**, settling
  PnL off the passed-in `currentPrice` instead of the real close price.
* `bigint` truncation in `updatePosition()` (average price, margin, liquidation price).
* Maker side is derived from the taker's side, assuming one counterparty per order.
* Risk still uses a price passed in by the caller — no real index/mark price source yet.

## Next Session Plan
1. Finish `isLiquidatable()` (P1).
2. Implement `liquidationChecks()`: collect first, then liquidate, then return the list.
3. Make `liquidatePosition()` settle from the actual fills.
4. Commit the engine prototype.
