Phase: 4 (Persistence, WAL & Distributed Event Bus)
Version: Rung 3 (BETTER in progress)
Current system: TypeScript matching engine with Write-Ahead Log (WAL), deterministic boot replay, Kafka command/event pipeline (order.commands -> engine.events), db-writer consuming trades into TimescaleDB tables/hypertables and caching to Redis, Redis-backed read routes (/positions, /equity), multi-market support (BTC-PERP, ETH-PERP), WebSocket channels with sequence numbers.
What works: End-to-end order placement, matching, initial margin lock, cancellation margin unlock, liquidation trigger check (2% MMR), real-fill liquidation settlement, counterparty position updates, partial liquidation shrinking, Invariants M1-M4, L1-L4, R1-R4, D1-D3 tested and passing. Failure experiments F1 (kill -9 replay), F2 (idempotency deduplication), and F4 (scam wick resilience) verified.
Next task: Reconciliation worker (deposits === available + locked + insurance + fees), paginated trade/order history, and Rung 4 AWESOME benchmarks.
Last 3 decisions:
- DECISION-007: Test gate becomes the GOOD rung.
- DECISION-008: Exchange treated as engineering lab (invariants, benchmarks, failures).
- DECISION-009: TimescaleDB for Postgres / hypertables.
Current learning level: L3 (Durable Distributed Systems)
