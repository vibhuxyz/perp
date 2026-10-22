# @repo/db

Drizzle schema and client for **TimescaleDB** (Postgres 16 + `timescaledb` extension). Same
`DATABASE_URL` as vanilla Postgres.

Relational tables (users, orders, positions, collateral) are ordinary Postgres tables.
Fills, trades, and OHLCV candles become hypertables at the BETTER rung.

```bash
bun run db:generate
bun run db:migrate
```

`DATABASE_URL=postgres://perp:password@localhost:5432/perp_db`
