# Session 07: Market Orders & Liquidations
**Date:** 2026-07-20

## Goal of the Session
Extend the in-memory TS Matching Engine to support Market Orders and build the foundational logic for the Liquidation Engine.

## What We Built
* Added `type: "MARKET"` to the `Order` interface.
* Updated the `matchLongOrder` algorithm to ignore price checks when the order is a `MARKET` order.
* Implemented "Immediate or Cancel" (IOC) style handling for the remainder of unfilled Market Orders by refusing to place them in the resting `bids` Map.
* Built the `liquidationChecks` method inside the `Engine` to iterate over user positions and detect bankruptcies.

## What I Implemented Myself
* Identified the risk of "Scam Wicks" and the necessity of external Oracles (`indexPrice`) for fair liquidations.
* Correctly implemented the mathematical bankruptcy logic for both `LONG` positions (price drops below liquidation price) and `SHORT` positions (price rises above liquidation price).

## New Concepts Learned
* **Index Price vs Last Traded Price:** Why exchanges rely on a weighted average of external exchanges to prevent local market manipulation from triggering unfair liquidations.

## Next Session Plan
* **Phase 4:** We have completed the Engine logic! Next, we will hook it up to Kafka to process real commands, and build the DB Writer microservice to persist our `fills` to PostgreSQL.
