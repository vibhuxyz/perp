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
*(Log starts below)*
