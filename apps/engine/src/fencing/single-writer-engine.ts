import type { Market } from "../types/index";
import type { EngineCommand } from "../wal/types";
import { Exchange } from "../core/Exchange";
import type { LeaseCoordinator } from "./lease-coordinator";
import type { FencedStore } from "./fenced-store";
import type { MarketLease } from "./types";

export class SingleWriterEngine {
  public nodeId: string;
  public market: Market;
  public exchange: Exchange;
  private coordinator: LeaseCoordinator;
  private store: FencedStore;
  private currentLease: MarketLease | null;
  private isZombie: boolean;

  constructor(
    nodeId: string,
    market: Market,
    coordinator: LeaseCoordinator,
    store: FencedStore,
  ) {
    this.nodeId = nodeId;
    this.market = market;
    this.coordinator = coordinator;
    this.store = store;
    this.exchange = new Exchange();
    this.exchange.createMarket(market);
    this.currentLease = null;
    this.isZombie = false;
  }

  public acquireOwnership(): boolean {
    const lease = this.coordinator.acquireLease(this.market, this.nodeId);
    if (!lease) {
      return false;
    }
    this.currentLease = lease;
    this.isZombie = false;
    return true;
  }

  public renewOwnership(): boolean {
    if (!this.currentLease || this.isZombie) {
      return false;
    }
    const ok = this.coordinator.renewLease(
      this.market,
      this.nodeId,
      this.currentLease.fencingToken,
    );
    if (!ok) {
      this.isZombie = true;
    }
    return ok;
  }

  public getFencingToken(): bigint {
    return this.currentLease?.fencingToken ?? 0n;
  }

  public isTerminated(): boolean {
    return this.isZombie;
  }

  public dispatch(command: EngineCommand): unknown {
    if (this.isZombie || !this.currentLease) {
      throw new Error(`Engine ${this.nodeId} is not the active single writer for ${this.market}`);
    }

    if (this.currentLease.leaseExpiresAt <= Date.now()) {
      this.isZombie = true;
      throw new Error(`Engine ${this.nodeId} lease has expired; mutation halted`);
    }

    try {
      this.store.append(
        this.market,
        this.nodeId,
        this.currentLease.fencingToken,
        command,
      );
    } catch (err) {
      this.isZombie = true;
      throw err;
    }

    return this.exchange.dispatch(command);
  }
}
