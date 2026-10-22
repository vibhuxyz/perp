import type { Order, Fill, Market, Side, Collateral } from "../types/index";
import type { EngineCommand, WriteAheadLog } from "../wal/index";
import { Ledger } from "./Ledger";
import { MatchingEngine } from "./MatchingEngine";
import { RiskManager } from "../risk/RiskManager";

export class Exchange {
  public ledger: Ledger;
  public matchingEngine: MatchingEngine;
  public riskManager: RiskManager;
  public restingOrders: Map<string, Map<string, Order>>;
  public appliedKeys: Set<string>;
  public wal?: WriteAheadLog;

  constructor(wal?: WriteAheadLog) {
    this.ledger = new Ledger();
    this.matchingEngine = new MatchingEngine();
    this.riskManager = new RiskManager(this.ledger, this.matchingEngine);
    this.restingOrders = new Map();
    this.appliedKeys = new Set();
    this.wal = wal;
  }

  public createMarket(market: Market): void {
    this.matchingEngine.createMarket(market);
  }

  public deposit(userId: string, amount: bigint): Collateral {
    const existing = this.ledger.usersCollateral.get(userId);

    if (existing) {
      existing.availableBalance += amount;
      return existing;
    }

    const collateral: Collateral = { userId, availableBalance: amount, marginLocked: 0n };
    this.ledger.usersCollateral.set(userId, collateral);

    return collateral;
  }

  private trackRestingOrder(order: Order): void {
    if (order.type !== "LIMIT" || order.quantity === 0n) {
      return;
    }
    let userOrders = this.restingOrders.get(order.userId);
    if (!userOrders) {
      userOrders = new Map();
      this.restingOrders.set(order.userId, userOrders);
    }
    userOrders.set(order.orderId, order);
  }

  public placeOrder(order: Order): Fill[] {
    if (order.type === "LIMIT") {
      this.ledger.lockMargin(order.userId, (order.price * order.quantity) / order.leverage);
    }

    const fills = this.matchingEngine.processOrder(order);
    const makerSide: Side = order.side === "LONG" ? "SHORT" : "LONG";

    for (const fill of fills) {
      if (order.type === "MARKET") {
        this.ledger.lockMargin(fill.takerUserId, (fill.price * fill.quantity) / fill.leverage);
      }

      this.ledger.updatePosition(fill.takerUserId, fill.market, order.side, fill.quantity, fill.price, fill.leverage);
      this.ledger.updatePosition(fill.makerUserId, fill.market, makerSide, fill.quantity, fill.price, fill.leverage);

      const makerOrders = this.restingOrders.get(fill.makerUserId);
      const makerOrder = makerOrders?.get(fill.makerOrderId);
      if (makerOrders && makerOrder && makerOrder.quantity === 0n) {
        makerOrders.delete(fill.makerOrderId);
      }
    }

    this.trackRestingOrder(order);

    return fills;
  }

  public cancelOrder(market: Market, userId: string, orderId: string): Order | undefined {
    const userOrders = this.restingOrders.get(userId);
    const resting = userOrders?.get(orderId);
    if (!resting) {
      return undefined;
    }

    const cancelled = this.matchingEngine.cancelOrder(market, orderId);
    if (!cancelled) {
      return undefined;
    }

    const marginToUnlock = (cancelled.price * cancelled.quantity) / cancelled.leverage;
    this.ledger.unlockMargin(userId, marginToUnlock);

    cancelled.status = "cancelled";
    userOrders?.delete(orderId);

    return cancelled;
  }

  public dispatch(command: EngineCommand): unknown {
    if (command.idempotencyKey && this.appliedKeys.has(command.idempotencyKey)) {
      return null;
    }

    if (this.wal) {
      this.wal.append(command);
    }

    let result: unknown = null;
    if (command.type === "DEPOSIT") {
      result = this.deposit(command.userId, command.amount);
    } else if (command.type === "PLACE_ORDER") {
      result = this.placeOrder(command.order);
    } else if (command.type === "CANCEL_ORDER") {
      result = this.cancelOrder(command.market, command.userId, command.orderId);
    }

    if (command.idempotencyKey) {
      this.appliedKeys.add(command.idempotencyKey);
    }

    return result;
  }

  public getRestingOrders(userId: string): Order[] {
    return Array.from(this.restingOrders.get(userId)?.values() ?? []);
  }
}
