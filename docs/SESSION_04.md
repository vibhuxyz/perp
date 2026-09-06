# Session 04: The Ingestion Layer & Queue Entry
**Date:** 2026-07-14

## Goal of the Session
Design the API ingestion gateway that validates user trades and pushes them safely into Kafka without bottlenecking on database locks.

## What We Built
* Defined the pseudo-code for the `POST /api/v1/order` route.
* Designed the Zod validation schema.
* Configured the Kafka Producer payload.

## What I Implemented Myself
* The integration logic bridging the Zod validation result with the Kafka Producer.
* The brilliant architectural decision to use `market` as the Kafka message `key`.
* The `PLACE_ORDER` event envelope pattern.

## New Concepts Learned
* **CQRS & Shock Absorbers:** Using Kafka to decouple high-frequency writes from slow database inserts.
* **API Gateway Security:** The danger of letting clients send derived state (`status`) and the necessity of strict Regex for numeric strings.
* **Stateless JWTs:** Extracting user identity via cryptography to save database trips.
* **Kafka Partition Keys:** How Kafka guarantees ordered processing. If the key is `BTC-PERP`, all BTC orders go to the same partition, preventing race conditions in the matching engine.

## Mistakes I Made
* Allowed the client to pass in `status`.
* Returned a `401 Unauthorized` for a `400 Bad Request` validation failure.
* Missed regex validation on stringified numbers.

## Next Session Plan
* **Phase 3 (Phase 0):** Transition to Go and design the in-memory architecture of the Matching Engine.
