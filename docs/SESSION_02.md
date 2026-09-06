# Session 02: Persistence (Drizzle Schema)
**Date:** 2026-07-14

## Goal of the Session
Translate our in-memory TypeScript API contracts into a persistent PostgreSQL database schema using Drizzle ORM, keeping extreme financial precision and API alignment in mind.

## What We Built
* Defined `collateral` and `position` tables in Drizzle.

## What I Implemented Myself
* The initial Drizzle table definitions, successfully establishing the foreign key relationships to the `users` table and setting up the basic columns.

## New Concepts Learned
* **Database Types for Money:** Storing money as a `varchar` (string) prevents database-level aggregations like `SUM()`. For systems that need exact precision without losing mathematical capabilities in SQL, `numeric/decimal` or `bigint` (representing cents/satoshis) is required.
* **Composite Unique Constraints:** Using `.unique()` on just `userId` in a positions table limits a user to one trade globally. Real systems use a composite unique constraint on `(userId, market)` to allow one position per market.

## Production Concepts Discussed
* **The Whale Overflow Problem:** Why standard 32-bit `integer` columns are dangerous for financial data, as they cap out around $21.4M if measuring in cents.
* **Contract Mismatches:** The critical importance of keeping the database column types (`uuid` string) perfectly aligned with the Kafka API contract (`string`).

## Next Session Plan
* **V3 (Production):** Set up the Docker environment (`docker-compose.yml`) to run Postgres, Redis, Kafka, and MinIO locally.
