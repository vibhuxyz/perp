import type { Market } from "../types/index";
import type { FencedRecord } from "./types";

export class StaleFencingTokenError extends Error {
  constructor(market: Market, attempted: bigint, current: bigint) {
    super(`Fencing token stale for ${market}: attempted ${attempted.toString()} < active ${current.toString()}`);
    this.name = "StaleFencingTokenError";
  }
}

export class FencedStore {
  private activeTokens: Map<Market, bigint>;
  private committedRecords: Map<Market, FencedRecord<unknown>[]>;

  constructor() {
    this.activeTokens = new Map();
    this.committedRecords = new Map();
  }

  public getActiveToken(market: Market): bigint {
    return this.activeTokens.get(market) ?? 0n;
  }

  public append<T>(market: Market, nodeId: string, fencingToken: bigint, payload: T): void {
    const active = this.getActiveToken(market);

    if (fencingToken < active) {
      throw new StaleFencingTokenError(market, fencingToken, active);
    }

    if (fencingToken > active) {
      this.activeTokens.set(market, fencingToken);
    }

    let records = this.committedRecords.get(market);
    if (!records) {
      records = [];
      this.committedRecords.set(market, records);
    }

    const record: FencedRecord<T> = {
      fencingToken: fencingToken.toString(),
      market,
      nodeId,
      payload,
      timestamp: Date.now(),
    };

    records.push(record);
  }

  public getRecords(market: Market): FencedRecord<unknown>[] {
    return this.committedRecords.get(market) ?? [];
  }
}
