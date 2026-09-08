# Architectural Decisions

## Decision 1: In-Memory Storage for V0

**Decision:** Start with in-memory arrays instead of a database.

**Why we chose it:**
- Fastest way to validate business logic
- No database setup complexity
- Easy to test the API contract
- Can change storage later without changing endpoints

**Alternatives considered:**
- Start with SQLite/PostgreSQL immediately
- Use a mock database library

**Trade-offs:**
- **Advantage:** Fast feedback, clear business logic
- **Disadvantage:** Data is lost on server restart
- **When to change:** V1, when we need persistence

---

## Decision 2: RESTful API Design

**Decision:** Use REST conventions (POST for create, PATCH for update, DELETE for remove).

**Why we chose it:**
- Standard convention all engineers understand
- Easy to test and reason about
- Works naturally with HTTP methods
- Scalable to multiple resources

**Alternatives considered:**
- GraphQL (overkill for V0)
- RPC-style endpoints

**Trade-offs:**
- **Advantage:** Familiar, predictable behavior
- **Disadvantage:** Less flexible than GraphQL for complex queries
- **When to change:** Only if query complexity explodes in V2+

---

## Decision 3: Sequential Integer IDs

**Decision:** Use simple incrementing integer IDs (1, 2, 3...).

**Why we chose it:**
- Simple to implement and reason about
- Fast lookups and comparisons
- Works fine for V0-V1

**Alternatives considered:**
- UUIDs (more complex, unnecessary for now)
- Database auto-increment from the start

**Trade-offs:**
- **Advantage:** Simplicity, fast operations
- **Disadvantage:** IDs reset on server restart (V0 limitation)
- **When to change:** V1, when we add a database with persistent IDs
