# Exchange — Manual Coding vs Vibe Coding vs Documentation

## Goal

Exchange should demonstrate **distributed systems + high-performance backend engineering + correctness + reliability**.

Current exchange/backend roles emphasize matching engines, order lifecycle, risk/liquidation, low latency, high throughput, determinism, fault tolerance, recovery, observability and performance SLAs. citeturn0search4turn0search16

---

# 1. Exchange architecture

```text
Client
 ↓
API
 ↓
Order Validation
 ↓
Risk / Balance
 ↓
Matching Engine
 ↓
Trade
 ↓
Event Bus
 ├── DB Writer
 ├── Position
 ├── PnL
 ├── Margin
 ├── Liquidation
 ├── Funding
 └── Market Data
```

---

# 2. Classification

| Component | Manual | Vibe | Read docs |
|---|---:|---:|---:|
| Matching engine | 🔴 | | |
| Order book | 🔴 | | |
| Price-time priority | 🔴 | | |
| Order lifecycle | 🔴 | | |
| Risk engine | 🔴 | | |
| Margin engine | 🔴 | | |
| Liquidation | 🔴 | | |
| Position engine | 🔴 | | |
| PnL | 🔴 | | |
| Funding | 🔴 | | |
| Insurance fund | 🔴 | | |
| ADL | 🔴 | | |
| Event ordering | 🔴 | | |
| Idempotency | 🔴 | | |
| Snapshot/recovery | 🔴 | | |
| Concurrency | 🔴 | | |
| Kafka integration | 🟡 | 🟡 | 🔴 |
| Redis | 🟡 | 🟢 | 🔴 |
| PostgreSQL | 🟡 | 🟢 | 🔴 |
| DB writer | 🔴 | 🟡 | |
| API CRUD | | 🟢 | |
| Auth | 🟡 | 🟢 | 🔴 |
| Admin UI | | 🟢 | |
| Trading UI | | 🟢 | |
| Docker | 🟡 | 🟢 | 🔴 |
| Kubernetes | 🟡 | 🟢 | 🔴 |
| Observability | 🟡 | 🟢 | 🔴 |
| Load testing | 🔴 | 🟡 | |
| Benchmarking | 🔴 | 🟡 | |
| Deployment config | 🟡 | 🟢 | 🔴 |

---

# 3. Matching Engine — MANUAL

This is the heart of the project.

You should manually understand and implement:

```text
Order
 ↓
Validate
 ↓
Order Book
 ↓
Match
 ↓
Trade
```

Understand:

- price-time priority
- bid/ask books
- market orders
- limit orders
- partial fills
- cancellation
- order IDs
- sequence numbers
- deterministic execution

Do not let AI design the matching algorithm for you.

---

# 4. Order Book — MANUAL

Implement:

```text
Bids
Price → Orders

Asks
Price → Orders
```

Understand:

- data structures
- insertion
- cancellation
- best bid/ask
- matching
- memory layout
- complexity

Then benchmark.

---

# 5. Risk engine — MANUAL

You should own:

```text
Balance
 ↓
Position
 ↓
Margin
 ↓
Mark price
 ↓
PnL
 ↓
Liquidation
```

AI can help with formulas/tests after you understand the financial logic.

Do not blindly copy financial calculations.

---

# 6. Event architecture — MANUAL

Design:

```text
OrderAccepted
OrderRejected
OrderMatched
TradeCreated
PositionUpdated
MarginUpdated
LiquidationTriggered
```

Understand:

- ordering
- delivery semantics
- idempotency
- retries
- duplicate events
- replay
- dead-letter handling

---

# 7. Kafka — READ DOCS + HYBRID

Read Kafka documentation for:

- partitions
- offsets
- consumer groups
- rebalancing
- ordering
- retention
- delivery semantics
- transactions

Then AI can generate:

- producer wrappers
- consumer boilerplate
- serialization
- metrics

But you must debug and explain:

```text
partition
offset
consumer group
rebalance
```

---

# 8. Snapshot / recovery — MANUAL

Your architecture:

```text
RAM state
 ↓
Snapshot
 ↓
Postgres / object storage
 +
Kafka offset
```

You should manually understand:

```text
Snapshot S
Kafka offset O
```

Recovery:

```text
Load S
 ↓
Restore state
 ↓
Replay events after O
 ↓
Current state
```

This is one of the best distributed-systems parts of your project.

---

# 9. Idempotency — MANUAL

Every important consumer should tolerate duplicates.

Example:

```text
Trade event
 ↓
DB writer
 ↓
already processed?
 ├── yes → skip
 └── no → write
```

Understand:

- idempotency keys
- unique constraints
- deduplication
- retries
- exactly-once claims vs practical semantics

---

# 10. Concurrency — MANUAL

Understand:

- race conditions
- locks
- atomics
- single-threaded matching
- worker concurrency
- queues
- backpressure

If using Node.js, understand what concurrency means in the event loop.

For performance-critical components, learn Go/Rust/C++ concepts later.

---

# 11. Performance — MANUAL

Don't just run the system.

Benchmark:

```text
orders/sec
trades/sec
p50 latency
p95 latency
p99 latency
CPU
memory
GC
queue depth
```

Test:

```text
1k
10k
100k
1M
```

where practical.

Current exchange roles emphasize latency budgets, throughput benchmarks, memory/performance tuning and correctness. citeturn0search4turn0search16

---

# 12. Load testing

You should design workloads yourself:

```text
normal
burst
cancel-heavy
match-heavy
high-contention
consumer slowdown
DB slowdown
worker failure
```

AI can generate load-test scripts.

You must understand the workload model and interpret results.

---

# 13. Observability

Use AI for dashboard boilerplate.

But manually define:

```text
Matching latency
Order acceptance latency
Trade latency
Kafka lag
DB writer lag
Redis latency
Snapshot duration
Recovery duration
Error rate
```

Build:

```text
Prometheus
Grafana
OpenTelemetry
```

Read the documentation for instrumentation and metric semantics.

---

# 14. What to vibe-code

Use AI heavily for:

```text
Admin UI
Trading UI
CRUD endpoints
DTOs
API clients
Serialization
Database migrations
Basic tests
Dockerfiles
Grafana dashboard JSON
Terraform boilerplate
Kubernetes YAML
Documentation
```

Review security-sensitive code.

---

# 15. What requires documentation

## Kafka

Read official docs before implementing event infrastructure.

## Redis

Read docs for:

- persistence
- transactions
- Lua/scripts
- streams
- locks
- replication

## PostgreSQL

Read docs for:

- transactions
- isolation
- indexes
- locks
- constraints
- WAL
- replication

## Docker/Kubernetes

Read official docs before production deployment.

## Financial/exchange concepts

Read authoritative exchange/microstructure references before implementing:

- margin
- liquidation
- funding
- insurance fund
- ADL
- mark price

---

# 16. Exchange priority

### Manually build/understand

1. Order book
2. Matching engine
3. Order lifecycle
4. Risk engine
5. Position engine
6. PnL
7. Margin
8. Liquidation
9. Funding
10. Insurance fund
11. ADL
12. Event contracts
13. Idempotency
14. Snapshot/recovery
15. Concurrency
16. Performance benchmarks

### Read docs + hybrid

17. Kafka
18. Redis
19. PostgreSQL
20. OpenTelemetry
21. Docker
22. Kubernetes
23. Cloud infrastructure

### Vibe-code heavily

24. UI
25. CRUD
26. API boilerplate
27. Admin panels
28. Dashboard presentation
29. Deployment manifests
30. Documentation

---

# 17. Exchange success test

You should be able to answer:

```text
Two orders arrive simultaneously.

What happens?

What determines priority?

What if the process crashes after matching
but before persistence?

What if Kafka delivers the event twice?

What if DB writer is down for 30 minutes?

What if Redis contains stale state?

How do you recover?

What is the latency budget?

Where is the bottleneck?
```

If you can answer these from first principles, the project has taught you real distributed-systems engineering.

---

# 18. Final rule for all three projects

## Vibe-code

```text
UI
CRUD
Boilerplate
Adapters
Serialization
Basic integrations
Documentation
Config
```

## Hybrid

```text
Cloud
Docker
Kubernetes
Kafka
Redis
Postgres
MCP
Provider APIs
Observability
Deployment
```

## Manual

```text
Architecture
Algorithms
State machines
Schedulers
Concurrency
Ownership
Recovery
Security
Evaluation
Performance
Core domain logic
```

## Read docs first

```text
MCP specification
Kafka semantics
Kubernetes primitives
Docker security
Git worktrees
OpenTelemetry
Provider APIs
vLLM
SGLang
PostgreSQL transaction semantics
Redis semantics
Exchange/financial mechanics
```

---

# 19. How to use AI without becoming dependent on it

For every important subsystem:

```text
1. Read documentation / concept
2. Design on paper
3. Implement a minimal version yourself
4. Write tests
5. Benchmark
6. Ask AI for code review
7. Compare AI's alternative
8. Refactor
9. Add failure cases
10. Document your decisions
```

For commodity code:

```text
1. Define interface
2. Ask AI to implement
3. Review
4. Test
```

This is the right balance for your goal.

---

# 20. The portfolio story

After following this approach:

```text
Exchange
   │
   └── Distributed systems
       Concurrency
       Event processing
       Reliability
       Performance

Appwright
   │
   └── AI product engineering
       Code generation
       Developer experience
       Agent execution
       Verification

Weave
   │
   └── Agent platform
       Coordinator
       Scheduler
       Workers
       MCP
       Model gateway
       Sandbox
       Evals
       Observability
       Recovery
```

Then add an inference lab:

```text
Inference Lab
   │
   ├── vLLM
   ├── SGLang
   ├── KV cache
   ├── batching
   ├── quantization
   ├── GPU
   └── benchmarking
```

This gives you a coherent **Applied AI Systems Engineer** portfolio rather than three unrelated projects.
