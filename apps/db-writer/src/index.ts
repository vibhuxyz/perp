import { writeFile } from "node:fs/promises";
import type { Collateral, Fill, Position } from "engine";
import { startDbWriterConsumer } from "./writer";

export * from "./writer";

export interface ExchangeState {
  usersCollateral: Map<string, Collateral>;
  userPositions: Map<string, Position[]>;
}

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

if (import.meta.main) {
  startDbWriterConsumer().catch(console.error);
}
