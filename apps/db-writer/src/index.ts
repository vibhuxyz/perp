import { writeFile } from "node:fs/promises";
import type { Collateral, Fill, Position } from "engine";

import {
  recordTrade,
  recordCandle,
  cacheUserState,
  startDbWriterConsumer,
  startDbWriterWorker,
} from "./writer";

export {
  recordTrade,
  recordCandle,
  cacheUserState,
  startDbWriterConsumer,
  startDbWriterWorker,
};

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
  console.log("[DB-Writer] Persistence worker started");
  startDbWriterConsumer().catch((err: unknown) => {
    console.error("[DB-Writer] Consumer error:", err);
  });
}
