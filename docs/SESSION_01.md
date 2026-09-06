# Session 01: Product Scope and API Contract
**Date:** 2026-07-14

## Goal of the Session
Define the absolute minimum viable product (MVP) scope for the Perpetual DEX/CEX and establish the strict TypeScript API contract for cross-service communication.

## What We Built
* Initialized Project Roadmap, Decisions Log, and Learning Log.
* Defined `Order`, `Fill`, `Position`, and `Balance` TypeScript interfaces.

## What I Implemented Myself
* The initial drafts of all core data structures, correctly identifying identity, quantities, price, and the Maker/Taker distinction.
* The Collateral logic separation (`availableBalance` vs `marginLocked`).

## New Concepts Learned
* **Floating Point Precision Trap:** Why `number` cannot be used for financial math in JS, and the "string over the wire" JSON serialization pattern.
* **Maker vs Taker:** The business mechanics of liquidity provision and fee tiers on an exchange.

## Production Concepts Discussed
* **API Contracts:** The necessity of strict type definitions when microservices communicate over Kafka.
* **Derived State Risk:** Why storing `isOpen: boolean` alongside `quantity` can lead to database inconsistencies.

## Engineering Decisions Made
* **DECISION-001:** Exact matching only, single market (BTC-PERP), single collateral (USDC). No market orders.

## Mistakes I Made
* Fell into the number trap for financial quantities.
* Misunderstood the difference between Makers (liquidity providers) and Takers (liquidity removers).

## Next Session Plan
* **V1 (Persistence):** Define the Drizzle schema mapping these in-memory concepts to persistent PostgreSQL tables.
