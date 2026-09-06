# Session 09: Doc Catch-up for the Liquidation Engine
**Date:** 2026-09-02

## Goal of the Session
1. Catch the docs up — the engine code moved ahead of the docs after Session 08.
2. Decide how to verify the matching + risk logic before building forward.
   Outcome: skip a formal test suite for now (DECISION-003), build forward.

## State Found at Session Start (code, not docs)
`apps/engine/src` already contained an uncommitted prototype well past "Session 08 next step":

* `type.ts` — `Order`, `Fill`, `Position`, `Collateral` interfaces, all on `bigint`.
* `orderbook.ts` — `Orderbook` + `PriceLevel` classes. LIMIT + MARKET matching, partial fills,
  price-time priority via array `shift()`, price levels stored in a `Map<bigint, PriceLevel>`
  sorted on read with `Array.from(keys).sort()`.
* `calculatePnL.ts` — unrealized PnL, LONG and SHORT.
* `index.ts` — `Engine` class:
  * `processOrder` — locks Initial Margin, calls the book, unlocks scaled margin per fill,
    updates both taker and maker positions.
  * `updatePosition` — new position (with `margin` + `liquidationPrice`) or averages into an
    existing one.
  * `liquidatePosition` — submits a forced opposite MARKET order, settles `margin + pnl` back
    to `availableBalance`, drops the position.
  * `liquidationChecks` — scans positions for a market against an index price; **only
    `console.log`s** on a hit, does not execute.
* `test.ts`, `try.ts` — scratch scripts, not real tests. `try.ts` is fully commented out.

## Known Issues / Suspicions (to confirm with tests)
* `liquidationChecks` never calls `liquidatePosition` — the loop is not closed.
* `processOrder` only unlocks margin for the taker (`user`), not the maker, inside the fill loop.
* Liquidation uses the full Initial Margin as the trigger, not a Maintenance Margin ratio —
  no buffer, position can go negative before we act.
* `bigint` division truncation in `updatePosition` (average price, margin) and liquidation-price
  math — small quantities can round hard.
* `liquidatePosition` runs the closing MARKET order through the book but ignores the resulting
  fills / actual close price; it settles PnL off the passed-in `currentPrice` instead.
* Maker-side position: `processOrder` derives `makerSide` from the taker order, assuming a single
  counterparty — breaks if one taker order fills against several makers on different sides
  (can't happen today, but the assumption is unstated).

## What We Did
* Updated `PROJECT_ROADMAP.md` — phase moved to 3.5, added `[~]` prototyped state, added
  V2.1 (wire the loop) and V2.2 (maintenance margin) tasks.
* Updated `LEARNING_LOG.md` — added BigInt-for-money, isolated margin / liquidation price,
  unrealized PnL, position averaging.
* Decided against a formal test suite for this phase — see DECISION-003.

## Change of Plan
* Decided to skip a formal `bun test` suite for now (see DECISION-003). Build forward instead.

## Next Session Plan
* V2.1: wire `liquidationChecks` → `liquidatePosition`.
* V2.2: move the trigger from full Initial Margin to a Maintenance Margin ratio.
* Confirm the Session 09 suspicions by hand with scratch scripts, then commit the engine prototype.
