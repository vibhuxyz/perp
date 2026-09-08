# Architecture Decisions Log

This document acts as our project's memory. Whenever we make a significant architectural decision, we record it here.

## Template
### [Decision Number]: [Short Title]
*   **Decision:** What we decided to do.
*   **Why we chose it:** The primary reason for the decision.
*   **Alternatives considered:** What else we looked at and why we didn't choose it.
*   **Trade-offs:** What we lose by making this decision.
*   **When we might change it:** The threshold or condition that would force a re-evaluation.

---
---
### DECISION-001: Perpetual MVP Scope Constraints
*   **Decision:** We are building a single-market (BTC-PERP), single-collateral (USDC) matching engine with exact matching (no partial fills) and no market orders.
*   **Why we chose it:** To aggressively limit scope so we can focus on the core engineering challenge: the distributed systems architecture (Kafka, Go Engine, Redis, Websockets) and matching algorithm correctness without being bogged down by edge cases like complex margin calculations or partial fills.
*   **Alternatives considered:** Building a multi-market, cross-margin platform with all order types. We rejected this because it introduces domain complexity too early.
*   **Trade-offs:** The resulting system is not fully "production-ready" for a real business yet, and extending exact-match to partial-match later will require a significant rewrite of the orderbook.
*   **When we might change it:** Once the core V4 distributed architecture is stable, tested, and can handle basic throughput.

---
### DECISION-002: TypeScript Matching Engine (Pivot from Go)
*   **Decision:** We are building the Matching Engine in TypeScript instead of Go.
*   **Why we chose it:** To lower the language barrier so we can focus 100% of our cognitive effort on learning distributed systems architecture (Kafka, CQRS, Exact Matching) instead of fighting a new language's syntax.
*   **Alternatives considered:** Pausing to learn Go fundamentals. Rejected because it breaks the momentum of the system design learning path.
*   **Trade-offs:** We lose Go's raw performance, strict memory layout control, and native concurrency (goroutines). Node's garbage collector and single-threaded nature might introduce latency spikes under heavy trading load.
*   **When we might change it:** Once the system is fully working in TS, we can treat the TS engine as a prototype and port it to Go/Rust if throughput becomes a business bottleneck.

---
### DECISION-003: Defer the Engine Test Suite
*   **Decision:** We are not writing an automated `bun test` suite for the matching + liquidation engine right now. We build V2.1 and V2.2 first, and verify behaviour with manual scratch scripts.
*   **Why we chose it:** To keep momentum on the system design learning path. The engine is still a fast-moving prototype; its shape will change again when the liquidation loop is wired and the Maintenance Margin trigger lands. Tests written now would mostly be rewritten.
*   **Alternatives considered:** Writing the full suite first (Session 09's original plan). Rejected for now to avoid testing a prototype that is about to change.
*   **Trade-offs:** The six suspected bugs from Session 09 stay unconfirmed by automation. Regressions in margin/PnL math will only surface by hand. This is money-moving code, so the risk is real.
*   **When we might change it:** Before Phase 4 (persistence). The engine state must be trustworthy before a worker writes it to Postgres/Redis. The test suite is a hard gate on starting Phase 4.

---
### DECISION-004: Raise the Target from MVP to Production Level
*   **Decision:** The project target is no longer "an MVP that matches orders". It is a
    production-level perpetual exchange, and work is now ordered by the Production Priority Stack
    (P1 perp mechanics -> P2 crash-safe state -> P3 financial correctness/idempotency ->
    P4 insurance fund -> P5 load testing -> P6 observability -> P7 deployed with bot flow).
*   **Why we chose it:** A matching engine without funding, mark price, liquidation, crash recovery
    and an insurance fund is not a perpetual exchange — it is an orderbook demo. The perp mechanics
    are the product, so they come first and everything else is judged against them.
*   **Alternatives considered:** Continuing feature-first (UI, WebSockets, Kafka wiring) and
    retrofitting risk later. Rejected — margin/liquidation bugs are the expensive kind, and
    retrofitting a WAL onto a live in-memory engine is far harder than designing for it now.
*   **Trade-offs:** Visible progress slows down. Nothing new appears on screen for several sessions
    while we finish risk, replay, and correctness. Phases 5 and 6 slip.
*   **When we might change it:** If the goal reverts to "demo it to someone this month", we would
    cut P4-P6 and jump to P7 with a clearly-labelled testnet.

---
### DECISION-005: Test Suite Gate Moves Earlier
*   **Decision:** The deferred engine test suite (DECISION-003) now blocks **P2 (write-ahead log
    and replay)**, not just Phase 4 persistence.
*   **Why we chose it:** Replay only works if the engine is a deterministic state machine —
    same commands in, same state out. We cannot claim determinism we have never tested. Building
    replay on top of an unverified state machine means silently reconstructing the *wrong* balances
    after a crash, which is worse than crashing.
*   **Alternatives considered:** Keeping the gate at Phase 4. Rejected — the WAL now lands before
    persistence in the priority order, so the gate has to move with it.
*   **Trade-offs:** DECISION-003's momentum argument still applies; we pay the test-writing cost
    sooner, while the engine is still changing shape.
*   **When we might change it:** Not before P2. The gate is the point.

