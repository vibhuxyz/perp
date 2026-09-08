# Project TODOs

Ordered by the Production Priority Stack in `PROJECT_ROADMAP.md`. Do not jump down the list.

## Immediate (P1 — Liquidation, Funding, Mark Price)
- [ ] Fill in `isLiquidatable()` in `apps/engine/src/risk.ts` — it is an empty stub today
      (`positionEquity(p, price) <= maintenanceMargin(p, price)`).
- [ ] Implement `liquidationChecks()` in `apps/engine/src/index.ts` (currently TODO comments only):
      collect breaching positions into an array FIRST, then liquidate — `liquidatePosition()`
      rebuilds `userPositions`, so liquidating mid-iteration corrupts the loop.
      Return the liquidated list so events can be emitted later.
- [ ] Make `liquidatePosition()` settle from the **actual close fills**, not the passed-in
      `currentPrice` — today it throws the fills away.
- [ ] Fix `processOrder()`: it only unlocks margin for the taker, never the maker.
- [ ] Mark price: implement `apps/mark-price-poller` (empty scaffold) to publish an index price;
      feed that into `liquidationChecks()` instead of the last traded price.
- [ ] Funding rate: settle longs vs shorts on a fixed interval (Phase 3.6 V1).
- [ ] Commit the engine prototype — it is still uncommitted.

## Next (P2 — Crash-safe state)
- [ ] Write-ahead log: append every accepted command before mutating in-memory state.
- [ ] Deterministic replay on boot; then periodic snapshots (Phase 7).

## Then (P3 — Financial correctness & idempotency)
- [ ] Engine test suite — **hard gate before Phase 4** (DECISION-003). Scope raised by DECISION-004:
      this now blocks P2 as well, because replay is only safe if the state machine is deterministic.
- [ ] Audit every `bigint` division for truncation: `updatePosition()` average price, margin,
      liquidation price; `maintenanceMargin()` ratio math.
- [ ] Idempotency keys on fills/events so a retry can't double-credit a balance.
- [ ] Reconciliation job: sum of position margin + available balance must equal deposits.

## Backlog (P4-P7)
- [ ] Insurance fund + ADL / socialized loss for bankruptcy gaps.
- [ ] Load test: concurrent order flow + rapid price updates, hunting margin-check races.
- [ ] Observability: immutable order/fill/liquidation log, latency + throughput metrics, alerts.
- [ ] Deploy: live URL, demo accounts, order-flow bot so the book isn't empty.
- [ ] Phase 2 V3: connect API to Kafka `order.commands` topic.
- [ ] Phase 4: Redis cache + batch writes to Postgres.
