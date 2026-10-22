Phase: 3.5 (Liquidation Engine) -> 4 (Persistence & WAL)
Version: Rung 2 (GOOD completed) -> Entering Rung 3 (BETTER)
Current system: In-process TypeScript matching engine, in-memory ledger with exact integer math, REST API with resting order management and cancellation, real Binance index poller, real funding mechanics, WS feed broadcasting depth, fills, liquidations, and ticker.
What works: End-to-end order placement, matching, initial margin lock, cancellation margin unlock, liquidation trigger check (2% MMR), real-fill liquidation settlement, counterparty position updates, partial liquidation shrinking, Invariants M1-M4, L1-L4, R1-R4 tested and passing, F4 scam wick experiment verified.
Next task: Climb to Rung 3 (BETTER): Write-Ahead Log (WAL) & deterministic boot replay, idempotency keys, Kafka integration (order.commands -> engine.events), TimescaleDB hypertables, WebSocket channels.
Last 3 decisions:
- DECISION-007: Test gate becomes the GOOD rung.
- DECISION-008: Exchange treated as engineering lab (invariants, benchmarks, failures).
- DECISION-009: TimescaleDB for Postgres / hypertables.
Current learning level: L2 (Contracts / Design) -> L3 (Durable Distributed Systems)
