# Todo List

## V0 - Working Prototype ✅
- [x] Initialize Node.js project
- [x] Install Express
- [x] Create POST /todos endpoint
- [x] Create PATCH /todos/:id endpoint
- [x] Create DELETE /todos/:id endpoint
- [x] Add error handling for missing todos
- [x] Test all endpoints with curl
- [x] Commit initial version

## V1 - Persistence (Next)
- [ ] Choose database (SQLite for development)
- [ ] Create schema (todos table)
- [ ] Replace in-memory storage with database queries
- [ ] Ensure IDs persist across restarts
- [ ] Test all endpoints still work
- [ ] Add database initialization script

## V2 - Clean Architecture
- [ ] Add input validation (title length, etc.)
- [ ] Add structured error responses
- [ ] Create repository pattern for data access
- [ ] Add logging
- [ ] Add basic unit tests
- [ ] Improve code organization

## V3 - Production Readiness
- [ ] Add integration tests
- [ ] Add environment configuration
- [ ] Create Dockerfile
- [ ] Set up basic monitoring/logging
- [ ] Add request validation middleware
- [ ] Create API documentation

## V4 - Scaling
- [ ] Consider horizontal scaling implications
- [ ] Add Redis for caching (if needed)
- [ ] Consider event sourcing (if complexity grows)
