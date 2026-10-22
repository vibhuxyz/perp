import type { Market } from "../types/index";

export interface MarketLease {
  market: Market;
  ownerNodeId: string;
  fencingToken: bigint;
  leaseExpiresAt: number;
  ttlMs: number;
}

export interface FencedRecord<T> {
  fencingToken: string;
  market: Market;
  nodeId: string;
  payload: T;
  timestamp: number;
}
