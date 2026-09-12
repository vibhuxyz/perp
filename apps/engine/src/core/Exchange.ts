import type { Order, Fill, Market, Side, Collateral } from "../types/index";
import { Ledger } from "./Ledger";
import { MatchingEngine } from "./MatchingEngine";
import { RiskManager } from "../risk/RiskManager";

export class Exchange {
  public ledger: Ledger;
  public matchingEngine: MatchingEngine;
  public riskManager: RiskManager;

  constructor() {
    this.ledger = new Ledger();
    this.matchingEngine = new MatchingEngine();
    this.riskManager = new RiskManager(this.ledger, this.matchingEngine);
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

  public placeOrder(order: Order): Fill[] {
    // A market order has no price until it executes, so its margin can only be sized
    // from the fills. A limit order reserves up front at its own price.
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
    }

    return fills;
  }
}
