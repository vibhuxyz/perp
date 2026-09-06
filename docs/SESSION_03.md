# Session 03: Production Environment (Docker)
**Date:** 2026-07-14

## Goal of the Session
Setup the local distributed infrastructure required for the Perpetual Exchange MVP (Kafka, Redis, Postgres, MinIO).

## What We Built
* Configured a `docker-compose.yml` to spin up 6 services: Zookeeper, Kafka, Kafdrop (Kafka UI), Redis, Postgres, and MinIO.

## What I Implemented Myself
* Handled the complex `KAFKA_ADVERTISED_LISTENERS` networking setup to allow external local apps to communicate with the dockerized Kafka broker.

## New Concepts Learned
* **YAML Scope Traps:** Indentation determines scope in YAML. Placing `networks` and `volumes` keys inside a `services` block causes critical parsing failures.
* **MinIO Entrypoint:** MinIO requires a `command: server /data` to actually spin up the object storage server, otherwise the container exits immediately.
* **Observability Tooling:** Utilizing `Kafdrop` allows us to visually inspect the Kafka event streams during local development.

## Mistakes I Made
* Indented top-level `volumes` and `networks` into the `minio` service block.
* Missed the startup `command` for the MinIO container.

## Next Session Plan
* **Phase 2 (V0):** Setup the Turborepo workspace and initialize the Core API (Node.js) that acts as the entrypoint for all trade orders.
