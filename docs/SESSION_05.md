# Session 05: The Matching Algorithm
**Date:** 2026-07-14

## Goal of the Session
Design the exact matching algorithm in memory, handling partial fills and orderbook mutations without garbage collection overhead.

## What We Built
* Defined the TS architecture for the Engine (`Order`, `PriceLevel`, `Orderbook`).
* Designed the logical loop for `matchLongOrder` matching incoming bids against resting asks.

## What I Implemented Myself
* Identified the exact business logic for partial fills: the incoming order takes what it can, and the remainder is either cancelled or added to the book.

## New Concepts Learned
* **Order Execution Types:** You accidentally discovered IOC (Immediate or Cancel) orders! For our MVP, we use standard LIMIT orders, which means the remainder rests on the book.
* **Garbage Collection Pauses:** Why we pass `Order` by reference and mutate `.size` instead of recreating objects. High-frequency engines cannot afford Node.js GC pauses.
* **Red-Black Trees:** Why we eventually need a self-balancing tree instead of a `Map` (to keep price keys sorted at O(log N) instead of sorting an array at O(N log N)).

## Engineering Decisions Made
* **DECISION-002:** We pivoted the Engine from Go to TypeScript to lower the language barrier and focus entirely on distributed systems concepts.

## Next Session Plan
* **Phase 3 V1:** Tie the matching algorithm to our `balances` map and emit the actual Kafka `engine.events` so the rest of the system knows a trade happened!
