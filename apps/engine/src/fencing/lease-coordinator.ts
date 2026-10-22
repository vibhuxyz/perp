import type { Market } from "../types/index";
import type { MarketLease } from "./types";

export class LeaseCoordinator {
  private leases: Map<Market, MarketLease>;
  private defaultTtlMs: number;
  private currentEpoch: bigint;

  constructor(defaultTtlMs = 1_000) {
    this.leases = new Map();
    this.defaultTtlMs = defaultTtlMs;
    this.currentEpoch = 1n;
  }

  public acquireLease(market: Market, nodeId: string): MarketLease | null {
    const existing = this.leases.get(market);
    const now = Date.now();

    if (existing && existing.leaseExpiresAt > now) {
      if (existing.ownerNodeId === nodeId) {
        existing.leaseExpiresAt = now + existing.ttlMs;
        return existing;
      }
      return null;
    }

    const token = this.currentEpoch++;
    const lease: MarketLease = {
      market,
      ownerNodeId: nodeId,
      fencingToken: token,
      leaseExpiresAt: now + this.defaultTtlMs,
      ttlMs: this.defaultTtlMs,
    };

    this.leases.set(market, lease);
    return lease;
  }

  public renewLease(market: Market, nodeId: string, token: bigint): boolean {
    const existing = this.leases.get(market);
    const now = Date.now();

    if (!existing || existing.ownerNodeId !== nodeId || existing.fencingToken !== token) {
      return false;
    }

    if (existing.leaseExpiresAt <= now) {
      return false;
    }

    existing.leaseExpiresAt = now + existing.ttlMs;
    return true;
  }

  public failover(market: Market, newOwnerNodeId: string): MarketLease {
    const now = Date.now();
    const token = this.currentEpoch++;
    const newLease: MarketLease = {
      market,
      ownerNodeId: newOwnerNodeId,
      fencingToken: token,
      leaseExpiresAt: now + this.defaultTtlMs,
      ttlMs: this.defaultTtlMs,
    };

    this.leases.set(market, newLease);
    return newLease;
  }

  public getLease(market: Market): MarketLease | undefined {
    return this.leases.get(market);
  }
}
