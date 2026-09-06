# Perpetual DEX/CEX MVP Roadmap (Problem & Postman Test Driven)

This roadmap outlines the exact problems to solve in each folder and how you can definitively verify they are solved using **Postman**.

---

## Phase 1: Infrastructure & Data Definition
*   **Folders**: `packages/db`, `packages/types`, `packages/shared`, workspace configs.
*   **What you need to solve**: 
    1. We need shared TypeScript interfaces (`Order`, `Fill`, `Balance`) so all microservices speak the same language.
    2. We need the Drizzle Schema to define the permanent PostgreSQL tables.
    3. We need Docker to spin up our local dependencies.
*   **How to test it**: 
    * *Postman is not applicable here.* Run `docker-compose up` to start Postgres, Redis, Kafka, and MinIO. Use Drizzle Studio to verify the tables are created in the database.

---

## Phase 2: The Core API & Queue Entry
*   **Folders**: `apps/server` 
*   **What you need to solve**: 
    1. Build a stateless Express/Next.js API.
    2. Implement JWT authentication.
    3. Build `POST /api/v1/order`. It must validate the JSON, ensure the market exists, and push the payload directly into the Kafka `order.commands` topic without touching the database.
*   **How to test it via Postman**:
    1. Send `POST /api/v1/signup` -> Expect `200 OK` with a JWT token.
    2. Send `POST /api/v1/order` with payload `{ "market": "BTC", "side": "LONG", "qty": 10 }`.
    3. Expect an instant `200 OK: { "status": "processing" }`.
    4. Open a Kafka UI (like Kafdrop in browser) and visually confirm your JSON payload is sitting in the `order.commands` topic.

---

## Phase 3: The Go Matching Engine
*   **Folders**: `apps/engine` (Go)
*   **What you need to solve**: 
    1. Build the B-Tree Orderbook and in-memory HashMaps for user balances and positions.
    2. Consume messages from `order.commands`.
    3. Run the exact matching algorithm (locking margin, matching price/qty).
    4. Push the resulting fills to the Kafka `engine.events` topic.
*   **How to test it via Postman**:
    1. In Postman, send a Buy order for $1000 BTC.
    2. In Postman, send a matching Sell order for $1000 BTC.
    3. Watch the Go Engine terminal output to see the match happen.
    4. Check the Kafka UI to confirm the `ORDER_FILLED` event was published to the `engine.events` topic.

---

## Phase 4: Persistence & Redis Caching
*   **Folders**: `apps/db-writer`
*   **What you need to solve**: 
    1. Consume the `engine.events` from Kafka using a Node.js worker.
    2. Instantly update the Redis cache with the user's new available balance and open position.
    3. Batch the trades (e.g., 50 at a time) and run a single `INSERT` into PostgreSQL using Drizzle.
    4. Add `GET` routes to `apps/api` that fetch directly from Redis.
*   **How to test it via Postman**:
    1. Send a trade via `POST /api/v1/order`.
    2. Send `GET /api/v1/equity/available`. The API should return the newly updated balance directly from Redis.
    3. Send `GET /api/v1/positions/open/BTC-PERP` and verify the position exists.

---

## Phase 5: Real-Time WebSockets
*   **Folders**: `apps/ws`
*   **What you need to solve**: 
    1. Build a WebSocket server capable of 100k+ concurrent connections.
    2. Connect it to Kafka `market.events` (for the public orderbook) and Redis pub/sub (for private user fills).
    3. Broadcast updates instantly to subscribers.
*   **How to test it via Postman**:
    1. Open Postman's **WebSocket** tool and connect to `ws://localhost:8080`.
    2. Send a subscription message: `{ "action": "subscribe", "channel": "orderbook_BTC" }`.
    3. Open a standard Postman HTTP tab and send `POST /api/v1/order`.
    4. Instantly see the Orderbook update JSON arrive in your Postman WebSocket window.

---

## Phase 6: The Frontend (Trading UI)
*   **Folders**: `apps/web`, `packages/ui`
*   **What you need to solve**: 
    1. Build the Trading UI components (Order book, charts, forms) using Next.js.
    2. Connect the React frontend to the REST API and the WebSocket server.
*   **How to test it**: 
    * *Postman is not applicable here.* Open `localhost:3000` in your browser. Place a trade in the UI and watch the numbers update in real-time.

---

## Phase 7: Crash Recovery & Snapshots
*   **Folders**: `apps/engine` (Go)
*   **What you need to solve**: 
    1. Every 60 seconds, serialize the Go Engine's RAM (B-Trees, Balances, Kafka Offset) and save it to the MinIO object store.
    2. Write the Engine boot-sequence to download this snapshot and replay unhandled Kafka commands.
*   **How to test it via Postman**:
    1. Place active limit orders via Postman.
    2. Force-kill the Go Engine process (`Ctrl+C`).
    3. While it's dead, send more `POST /api/v1/order` requests via Postman. (The API won't crash, the queue will just hold them).
    4. Restart the Go Engine. Watch its logs confirm it loaded the MinIO snapshot and immediately processed your backlog of Postman requests.

---

## Phase 8: Advanced Exchange Mechanics (Funding & Liquidations)
*   **Folders**: `apps/mark-price-poller`, `apps/engine`
*   **What you need to solve**: 
    1. Poller fetches Binance prices and pushes them to Kafka.
    2. Engine calculates Funding Rates and applies them to memory balances.
    3. Engine liquidates accounts whose equity falls below maintenance margin, utilizing the Insurance Fund.
*   **How to test it via Postman**:
    1. Use Postman to create a highly-leveraged Long position.
    2. Temporarily mock the `mark-price-poller` to send a massively crashed Binance price to Kafka.
    3. Watch the Go Engine logs trigger a liquidation.
    4. Use Postman `GET /api/v1/equity/available` to confirm the user's balance was wiped out.
