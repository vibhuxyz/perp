# Session 01 - V0 Prototype

**Date:** 2026-09-08  
**Duration:** ~30 minutes  
**Goal:** Build a working V0 todo app with 3 core endpoints

---

## What We Built

A simple Express.js server that manages todos with three REST endpoints:

**Endpoints:**
- `POST /todos` - Create a new todo
- `PATCH /todos/:id` - Mark a todo as done
- `DELETE /todos/:id` - Remove a todo

**Architecture:**
- In-memory array storage (no database yet)
- Sequential integer IDs (1, 2, 3...)
- JSON request/response format
- Basic error handling (404 for missing todos)

---

## What You Implemented Yourself
None — this was a guided build to understand the architecture from scratch.

---

## New Concepts Learned

### REST API Design
- HTTP methods map to operations (POST=create, PATCH=update, DELETE=delete)
- Resources are nouns, operations are verbs
- Status codes communicate success/failure (201 created, 404 not found, etc.)

### Express.js Basics
- `app.post()`, `app.patch()`, `app.delete()` to define routes
- `express.json()` middleware to parse request bodies
- `req.params` to extract URL parameters
- `res.status().json()` to send JSON responses

### Testing APIs
- `curl -X METHOD URL` to send requests
- `-H "Content-Type: application/json"` for JSON requests
- `-d` flag to send JSON data
- `jq` tool to pretty-print JSON responses

---

## Production Concepts Discussed

### Why V0 is Not Production-Ready
1. **No Persistence:** Data disappears when server restarts
2. **No Validation:** Anyone can send empty titles or malformed requests
3. **No Logging:** Can't debug problems in production
4. **No Testing:** We manually tested with curl, not automated tests
5. **No Monitoring:** No observability into failures

### What V1 Will Add
Database persistence so todos survive server restarts and can be queried later.

---

## Engineering Decisions Made

| Decision | Choice | Why |
|----------|--------|-----|
| Storage | In-memory arrays | Fastest way to validate business logic |
| ID Strategy | Incrementing integers | Simple, fast, good for V0 |
| API Style | REST | Standard, predictable, scalable |
| Framework | Express.js | Lightweight, good for learning |

---

## Trade-offs Considered

1. **Simplicity vs. Completeness**
   - Chose simplicity: no auth, no validation yet
   - Will add incrementally when needed

2. **Database Now vs. Later**
   - Chose later: V0 proves business logic works first
   - V1 will add persistence without changing API

3. **TypeScript vs. JavaScript**
   - Chose JavaScript for V0 (faster to build)
   - Can migrate to TypeScript in V2 if needed

---

## Problems Encountered

None! V0 was straightforward because we kept it minimal.

---

## Code Review Summary

**Strengths:**
- Clean, readable endpoint handlers
- Proper HTTP status codes (201 for create, 404 for missing)
- Error handling included from the start
- Tested all happy paths and error cases

**Areas to Improve:**
- No input validation (anyone can send empty title)
- No logging (can't debug in production)
- No persistence (data lost on restart)
- No structured error response format
- No tests (manual testing only)

---

## Mistakes Made
None in this session.

---

## Things to Remember

1. **V0 is not production code** — it's a validated prototype
2. **Each version solves one problem:**
   - V0 = business logic works
   - V1 = data persists
   - V2 = architecture is clean
   - V3 = production-ready
   - V4 = scales horizontally

3. **Don't skip versions** — jumping to "production" architecture wastes effort if requirements change

4. **RESTful endpoints map naturally to database operations:**
   - POST → INSERT
   - PATCH → UPDATE
   - DELETE → DELETE
   - GET (we'll add) → SELECT

---

## Homework Before Next Session

Nothing required — you can explore the code if interested.

---

## Next Session Plan

**V1 - Add Persistence**

1. Install SQLite (or similar) 
2. Create a todos table (id, title, done, createdAt)
3. Replace in-memory array with database queries
4. Verify all endpoints still work
5. Test that data persists across server restarts
6. Update documentation

**Why this matters:** Without persistence, you can't build real applications. V1 teaches you how to connect an API to a database safely.

---

## Session Reflection

**What you did well:**
- Asked clear questions about the architecture
- Understood why V0 is minimal (not "incomplete")
- Tested thoroughly with curl

**Biggest weakness:**
- No major issues — this was a learning session, not a production build

**One production concern you might've missed:**
- What happens if two requests try to add the same todo at the same time? (Race condition) — we'll address this with databases and transactions in V1

**One thing to improve next:**
- Start adding logging so you can debug in production

**One advanced topic that naturally follows:**
- Database transactions: how to ensure consistency when multiple operations need to succeed together
