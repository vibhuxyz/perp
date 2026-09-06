# Learning Log

This document continuously tracks engineering concepts learned, mistakes made, and skills gained throughout the project.

## Concepts Mastered (Existing Knowledge)
* TypeScript
* Prisma & Drizzle
* Event-Driven Architecture
* RabbitMQ & Redis
* WebSockets
* JWT Authentication
* Docker & GitHub Actions
* Turborepo & Next.js

## Concepts I Am Learning
* Distributed Systems Architecture
* High-Performance In-Memory Data Structures (B-Trees)
* Kafka Internals (Partitions, Offsets, Consumer Groups)
* CQRS (Command Query Responsibility Segregation) & Event Sourcing
* Snapshotting and Crash Recovery
* Exactly-Once Processing Guarantees
* **Floating Point Precision Trap:** Never use `number` for financial math. Use strings for JSON serialization and specialized Decimal libraries/integers for internal calculations.
* **Database Types for Money:** Storing money as a string (`varchar`) in the database prevents `SUM()` and other DB-level aggregations. Use `numeric`/`decimal` (for exact precision) or `bigint` (representing lowest denominations like cents) in PostgreSQL.
* **Composite Unique Constraints:** Using `.unique()` on `userId` limits the table to one row per user. For tables where a user can have multiple distinct records (like one position per market), use a composite unique constraint on `(userId, market)`.
* **Maker vs Taker:** Makers provide liquidity (resting limit orders). Takers remove liquidity (crossing orders). Exchanges charge takers higher fees and makers lower fees (or give rebates) to incentivize a thick orderbook.
* **CQRS & The "Shock Absorber":** In high-throughput systems, the API layer (Ingestion) does NOT write to the database. It validates requests and pushes them to a message queue (Kafka) which acts as a shock absorber. A separate consumer (the Matching Engine) reads the queue and determines the true state.
* **API Gateway Security:** A client must *never* dictate its own state (like `status: "filled"`). Furthermore, always validate that "string over the wire" numbers strictly match a numeric regex (e.g., `/^\d+(\.\d+)?$/`) before pushing to internal queues.
* **Stateless Authentication (JWT):** Because JWTs are cryptographically signed, the API can verify identity using just a `JWT_SECRET` and extract the `userId` directly from the token payload without *ever* touching the database. This is critical for maintaining high throughput (100k+ req/sec).
* **Kafka Partition Keys for Concurrency:** In a trading engine, order execution must be strictly sequential per market. By setting the Kafka message `key` to the `market` (e.g., "BTC-PERP"), Kafka guarantees that all BTC orders are routed to the exact same partition, ensuring the Go Engine processes them in perfect chronological order without race conditions.
* **Orderbook Data Structures:** A simple Array is too slow for an orderbook because you must re-sort it every time a trade happens. Production exchanges use self-balancing trees (like **Red-Black Trees** or **B-Trees**) because they automatically keep prices sorted from best to worst, allowing lighting-fast matching.
* **Go for TS Developers (Memory):** Go gives you strict control over memory. A `struct` is like a TS `interface`. A Slice `[]T` is like a TS Array `T[]`. Pointers `*T` allow you to modify the exact same object in memory instead of creating a copy (crucial for high-performance engines).
* **Garbage Collection (GC) Pauses:** In Node.js, if you constantly create new objects (like recreating an `Order` every time its size changes), the memory fills up quickly. The V8 engine must freeze your application to run the Garbage Collector and clear memory. In a trading engine, this freeze causes unacceptable latency spikes. This is why we mutate existing objects by reference in high-frequency systems.
* **Order Execution Types:** When an order partially fills, standard LIMIT orders leave the remaining size resting on the orderbook. "Immediate or Cancel" (IOC) orders cancel the remainder. "Fill or Kill" (FOK) orders cancel the entire order if it cannot be 100% filled instantly.
* **OOP in Trading Engines:** Object-Oriented Programming is perfect for engines because we need to encapsulate state. An `Engine` class holds `Orderbook` classes, which hold `PriceLevel` classes. This prevents global variable pollution.
* **Sync vs Async in Matching:** The actual matching loop (subtracting balances, matching sizes) MUST be 100% synchronous. If you use `await` inside the matching loop, Node.js pauses execution, allowing another incoming order to mutate the orderbook simultaneously (Race Condition!). We only use `async/await` for I/O, like pulling from or pushing to Kafka.
* **Pure Domain Models (Hexagonal Architecture):** A matching engine should not know that Kafka or PostgreSQL even exists. It should be a pure state machine (`State + Order -> New State + Fills`). This allows you to test millions of orders locally without spinning up any infrastructure.
* **BigInt for Money and Size:** We moved the whole engine from `number` to `bigint`. `bigint` is an integer type with no floating-point rounding, so `price * quantity` is always exact. The cost: `bigint` division truncates (`7n / 2n === 3n`), so margin and PnL math can lose the fractional part unless we scale values up (e.g. store prices in "cents" or smaller units). JSON has no `bigint`, so anything crossing the wire still travels as a string.
* **Isolated Margin & Liquidation Price:** Each position locks its own `margin` (Initial Margin). The `liquidationPrice` is the price where losses eat the whole margin: for a LONG it is `avgPrice - margin/quantity`, for a SHORT `avgPrice + margin/quantity`. Real exchanges liquidate earlier, at a Maintenance Margin ratio (e.g. when equity drops below 0.5% of notional), leaving a buffer for the exchange to close the position before it goes negative.
* **Unrealized PnL:** Profit you have on paper but have not locked in. `(markPrice - avgPrice) * quantity` for a LONG, flipped for a SHORT. It becomes realized only when the position closes (voluntarily or by liquidation).
* **Position Averaging:** Adding to a position blends the entry price: `newAvg = (oldQty*oldAvg + addQty*addPrice) / (oldQty + addQty)`. Watch the truncation trap here — this is `bigint` division.
* **Index Price vs Last Traded Price (Scam Wicks):** To liquidate users, exchanges use an external "Index Price" (an Oracle average of Binance/Coinbase) rather than their own `lastTradedPrice`. If a small exchange used its own price, a malicious trader could place a tiny Market Sell order into a thin orderbook, artificially crashing the local price to $1 momentarily (a "Scam Wick"). This would trigger massive liquidations across the exchange unfairly.

## Engineering Habits to Improve
* Thinking about failure modes before implementation.
* Implementing iteratively (V0 -> V4) rather than skipping to production-ready architecture.

## Common Mistakes
* *(To be updated as the project progresses)*
