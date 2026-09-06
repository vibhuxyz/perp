# Project TODOs

## Immediate Tasks (Session 09 — Close the Liquidation Loop)
- [ ] V2.1: wire `liquidationChecks()` to call `liquidatePosition()`.
- [ ] V2.2: switch liquidation trigger from full Initial Margin to a Maintenance Margin ratio.
- [ ] Confirm the Session 09 suspicions by hand (manual `bun run` scratch scripts, not a test suite):
      - `processOrder` only unlocks margin for the taker, not the maker.
      - `liquidatePosition` settles PnL off the passed-in `currentPrice`, ignores the real close fills.
      - `bigint` truncation in `updatePosition` average price / margin / liquidation price.
- [ ] Commit the engine prototype once the loop is wired.

## Backlog
- [ ] Phase 2 V3: Connect API to Kafka `order.commands` topic.
- [ ] Phase 4: Redis cache + batch writes to Postgres.
- [ ] Automated test suite for the engine — deferred by choice (see DECISION-003). Revisit before Phase 4.
