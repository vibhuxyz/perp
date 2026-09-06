# Session 06: OOP Engine Architecture & Balance Checking
**Date:** 2026-07-20

## Goal of the Session
Wrap the exact matching algorithm in an OOP Engine class to handle multi-market routing, test the logic independently of Kafka (Dependency Inversion), and manage user collateral strictly in-memory.

## What We Built
* Defined the `Engine` class as a parent wrapper.
* Routed orders to the correct `Orderbook` via a `Map<string, Orderbook>`.
* Simulated a localized testing environment that doesn't need Kafka.
* Added `user.marginLocked` logic to check and lock funds before routing to the orderbook, and settle the funds after the fills are returned.

## What I Implemented Myself
* Refactored `Collateral` and `Fill` to use `bigint`.
* Mapped the `maker` and `taker` relationships for generating the trading receipts (`fills`).
* Handled the post-trade settlement loop.

## New Concepts Learned
* **Hexagonal Architecture:** Keeping the Matching Engine entirely unaware of databases or message queues makes it easily testable.
* **String Parsing vs BigInt Math:** Why converting strings to numbers in Node.js causes massive Garbage Collection latency in high-frequency trading. The Ingestion layer handles string-parsing; the Engine handles pure math.
* **Asynchronous Danger:** Why the matching loop MUST be 100% synchronous to prevent race conditions on the event loop.

## Next Session Plan
* **Phase 4:** Hooking this pure TS Engine up to our actual Kafka consumer, and creating the DB-Writer microservice to save the `fills` to PostgreSQL!
