import type { Order, Fill, Market, Side, Collateral } from "../types/index";
import type { EngineCommand, WriteAheadLog } from "../wal/index";
import { Ledger } from "./Ledger";
import { MatchingEngine } from "./MatchingEngine";
import { RiskManager } from "../risk/RiskManager";
import { validatePreTradeRisk } from "../risk/pre-trade";
import { AuditLog } from "../audit/AuditLog";
import { MetricsCollector } from "../metrics/MetricsCollector";

export class Exchange {
  public ledger: Ledger;
  public matchingEngine: MatchingEngine;
  public riskManager: RiskManager;
  public restingOrders: Map<string, Map<string, Order>>;
  public appliedKeys: Set<string>;
  public wal?: WriteAheadLog;
  public auditLog: AuditLog;
  public metrics: MetricsCollector;

  constructor(wal?: WriteAheadLog) {
    this.auditLog = new AuditLog();
    this.metrics = new MetricsCollector();
    this.ledger = new Ledger();
    this.matchingEngine = new MatchingEngine();
    this.riskManager = new RiskManager(this.ledger, this.matchingEngine, this.auditLog);
    this.restingOrders = new Map();
    this.appliedKeys = new Set();
    this.wal = wal;
  }

  public createMarket(market: Market): void {
    this.matchingEngine.createMarket(market);
  }

  public deposit(userId: string, amount: bigint): Collateral {
    const existing = this.ledger.usersCollateral.get(userId);

    this.auditLog.record("COLLATERAL_DEPOSITED", userId, { amount: amount.toString() });

    if (existing) {
      existing.availableBalance += amount;
      return existing;
    }

    const collateral: Collateral = { userId, availableBalance: amount, marginLocked: 0n };
    this.ledger.usersCollateral.set(userId, collateral);

    return collateral;
  }

  public withdraw(userId: string, amount: bigint): boolean {
    const user = this.ledger.usersCollateral.get(userId);
    if (!user || user.availableBalance < amount) {
      return false;
    }

    user.availableBalance -= amount;
    this.auditLog.record("COLLATERAL_WITHDRAWN", userId, { amount: amount.toString() });
    return true;
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

  private processFills(order: Order, fills: Fill[], makerSide: Side): void {
    for (const fill of fills) {
      if (order.type === "MARKET") {
        this.ledger.lockMargin(fill.takerUserId, (fill.price * fill.quantity) / fill.leverage);
      } else if (order.type === "LIMIT") {
        const orderMarginForFill = (order.price * fill.quantity) / order.leverage;
        const fillMargin = (fill.price * fill.quantity) / fill.leverage;
        const marginDiff = fillMargin - orderMarginForFill;
        if (marginDiff !== 0n) {
          const user = this.ledger.usersCollateral.get(fill.takerUserId);
          if (user) {
            user.marginLocked += marginDiff;
            user.availableBalance -= marginDiff;
          }
        }
      }

      this.ledger.updatePosition(fill.takerUserId, fill.market, order.side, fill.quantity, fill.price, fill.leverage);
      this.ledger.updatePosition(fill.makerUserId, fill.market, makerSide, fill.quantity, fill.price, fill.leverage);

      const makerOrders = this.restingOrders.get(fill.makerUserId);
      const makerOrder = makerOrders?.get(fill.makerOrderId);
      if (makerOrders && makerOrder) {
        if (makerOrder.quantity === 0n) {
          makerOrder.status = "filled";
          makerOrders.delete(fill.makerOrderId);
        } else {
          makerOrder.status = "partially_filled";
        }
      }

      this.auditLog.record("ORDER_FILLED", fill.takerUserId, {
        fillId: fill.fillId,
        price: fill.price.toString(),
        quantity: fill.quantity.toString(),
        makerUserId: fill.makerUserId,
      }, fill.market);
    }
  }

  public placeOrder(order: Order): Fill[] {
    this.createMarket(order.market);
    const risk = validatePreTradeRisk(order, this.ledger);
    if (!risk.valid) {
      order.status = "rejected";
      this.auditLog.record("ORDER_REJECTED", order.userId, {
        orderId: order.orderId,
        reason: risk.reason ?? "Pre-trade risk check failed",
      }, order.market);
      return [];
    }

    const t0 = process.hrtime.bigint();

    if (order.type === "LIMIT") {
      this.ledger.lockMargin(order.userId, (order.price * order.quantity) / order.leverage);
    }

    this.auditLog.record("ORDER_PLACED", order.userId, {
      orderId: order.orderId,
      side: order.side,
      type: order.type,
      quantity: order.quantity.toString(),
      price: order.price.toString(),
    }, order.market);

    const initialQuantity = order.quantity;
    const fills = this.matchingEngine.processOrder(order);
    const makerSide: Side = order.side === "LONG" ? "SHORT" : "LONG";

    this.processFills(order, fills, makerSide);
    this.trackRestingOrder(order);

    if (order.quantity === 0n) {
      order.status = "filled";
    } else if (fills.length > 0 && order.quantity < initialQuantity) {
      order.status = "partially_filled";
    } else {
      order.status = "resting";
    }

    const t1 = process.hrtime.bigint();
    this.metrics.recordTiming(t1 - t0);

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

    this.auditLog.record("ORDER_CANCELLED", userId, { orderId, market }, market);

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
    } else if (command.type === "WITHDRAW") {
      result = this.withdraw(command.userId, command.amount);
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
