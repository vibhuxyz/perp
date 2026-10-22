# 10x and 100x Scale Analysis

Engineering roadmap analyzing systemic bottlenecks, failure domains, and architectural transitions as order volume scales from 1x to 100x.

---

## 1. Current Architecture (1x Scale)

- **Throughput Capacity:** 1.5M - 2.1M orders/sec per market ([`BENCHMARKS.md`](file:///Users/xyz/Coding/perp/docs/BENCHMARKS.md)).
- **Topology:** Single-process in-memory matching engine with `SortedKeysOrderbook`, synchronous write-ahead log (WAL), Kafka KRaft command/event bus, TimescaleDB hypertables for candles and trades, Redis cache for balances/positions.
- **Limiting Factor at 1x:** Single CPU core utilization per market.

---

## 2. 10x Scale (10–50 Markets, 50,000 continuous orders/sec)

### What Breaks First:
1. **Single Engine Process Contention:** Running multiple active markets in one Node/Bun process causes event-loop thread contention. A burst of liquidations on `BTC-PERP` delays execution of limit orders on `ETH-PERP`.
2. **Database Write Pressure:** Direct row inserts into TimescaleDB create write lock contention on hypertables and deplete database connection pools.
3. **Kafka Partition Serialization:** A single Kafka topic without market partitioning forces all consumer threads to serialize message delivery.

### Required Architecture Changes:
1. **Engine Process Sharding:**
   - Shard matching engines: 1 isolated worker process per market (e.g. `engine-btc-perp`, `engine-eth-perp`, `engine-sol-perp`).
   - Each engine runs on its own dedicated CPU core with zero cross-market lock contention.
2. **Kafka Partitioning by Market:**
   - Command topics partitioned by market key: `order.commands` keyed by `market`.
   - Event topics partitioned identically: `engine.events` keyed by `market`.
3. **Micro-Batched Timescale Writing:**
   - `db-writer` aggregates trades and candles in memory buffers (100ms or 1,000 trades) using `COPY` or multi-value `INSERT` statements into Timescale hypertables.
4. **WebSocket Fanout Gateway:**
   - Offload WebSocket client connection termination to a dedicated API Gateway cluster (`apps/ws` scaled horizontally behind an L4 load balancer), decoupling client socket I/O from engine event processing.

---

## 3. 100x Scale (100+ Markets, 500,000+ continuous orders/sec)

### What Breaks First:
1. **Cross-Margin State Synchronization:** In cross-margin mode, position margin is pooled across all markets. When engines are distributed across different processes/nodes, checking whether a trader has sufficient margin requires distributed coordination across multiple engines.
2. **Redis Network Bandwidth & Single-Threaded Bottleneck:** Single-instance Redis memory throughput caps at ~100k-150k read/write ops/sec.
3. **Disk I/O Latency Spikes on WAL Flushes:** Synchronous disk writes (`fsync`) to standard SSDs exhibit p99 latency spikes (5–20 ms) during heavy write bursts, stalling the matching loop.

### Required Architecture Changes:
1. **Two-Tier Margin & Matching Separation (Disruptor Pattern):**
   - **Tier 1 (Risk/Margin Gateway):** A dedicated, zero-allocation pre-trade risk engine (LMAX Disruptor ring buffer in shared memory) verifies available collateral and locks margin in <500 nanoseconds before routing orders to matching engines.
   - **Tier 2 (Matching Engines):** Sharded matching engines only process pre-cleared orders. They do not query external balances, maintaining pure sub-microsecond in-memory matching.
2. **Sharded Redis Cluster Partitioned by User ID:**
   - Redis cluster partitioned by `hash(userId) % N` so user balance queries are distributed evenly across independent Redis nodes.
3. **Direct I/O NVMe Write-Ahead Logging:**
   - Replace standard filesystem WAL with direct block I/O (`O_DIRECT` / `io_uring`) on dedicated NVMe striped disks (RAID-10), bypassing OS page cache and guaranteeing deterministic <10 microsecond write latencies at p99.9.
4. **Partitioned Auto-Deleveraging (ADL):**
   - ADL priority queues maintained independently per market in local engine memory, enabling instantaneous deficit resolution during flash crashes without network round-trips.
