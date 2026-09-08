# Todo App - Project Roadmap

## Phases Overview
We build in iterations: V0 → V1 → V2 → V3 → V4, each unlocking new capabilities without premature optimization.

## Phase: V0 ✅
**Goal:** Validate business logic with in-memory storage

**Completed Tasks ✅**
- [x] POST /todos - Add a new todo
- [x] PATCH /todos/:id - Mark a todo as done
- [x] DELETE /todos/:id - Remove a todo
- [x] Basic error handling (404 for missing todos)
- [x] JSON request/response handling

**Current Task 🚧**
None - V0 is complete

**Blocked Tasks 🚫**
None

**Next Tasks 📌**
1. V1: Add persistent storage (SQLite or similar)
2. V2: Add validation and architecture improvements
3. V3: Add testing and logging
4. V4: Production readiness (Docker, CI/CD, monitoring)

## Upcoming Milestone
**V1 - Persistence:** Replace in-memory storage with a real database so data survives server restarts.
