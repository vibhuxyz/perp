import { writeFile } from "node:fs/promises";
import type { Collateral, Fill, Position } from "engine";

export interface ExchangeState {
  usersCollateral: Map<string, Collateral>;
  userPositions: Map<string, Position[]>;
}

/**
 * Writes the whole world to a JSON file. This is the placeholder for Redis plus batched
 * Postgres writes: it is a full rewrite every time rather than a change feed, so it does
 * not scale past a toy book, but it does mean state survives the process.
 */
export async function snapshot(state: ExchangeState, fills: Fill[], path: string): Promise<void> {
  const json = JSON.stringify(
    {
      savedAt: new Date().toISOString(),
      collateral: Object.fromEntries(state.usersCollateral),
      positions: Object.fromEntries(state.userPositions),
      fills,
    },
    (_key, value) => (typeof value === "bigint" ? value.toString() : value),
    2,
  );

  await writeFile(path, json);
}
