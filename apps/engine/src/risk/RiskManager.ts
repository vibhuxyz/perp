import type { Order, Position, Market, Side } from "../types/index";
import type { Ledger } from "../core/Ledger";
import type { MatchingEngine } from "../core/MatchingEngine";
import { isLiquidatable } from "./risk";

export class RiskManager {
  private ledger: Ledger;
  private matchingEngine: MatchingEngine;

  constructor(ledger: Ledger, matchingEngine: MatchingEngine) {
    this.ledger = ledger;
    this.matchingEngine = matchingEngine;
  }

  public checkLiquidations(market: Market, currentIndexPrice: bigint): Position[] {
    const breaching: Position[] = [];

    for (const positions of this.ledger.userPositions.values()) {
      for (const position of positions) {
        if (position.market === market && isLiquidatable(position, currentIndexPrice)) {
          breaching.push(position);
        }
      }
    }

    for (const position of breaching) {
      this.liquidatePosition(position);
    }

    return breaching;
  }

  public liquidatePosition(position: Position): void {
    const closingSide: Side = position.side === "LONG" ? "SHORT" : "LONG";
    const leverage = position.margin > 0n
      ? (position.averagePrice * position.quantity) / position.margin
      : 1n;

    const closingOrder: Order = {
      userId: position.userId,
      orderId: `liquidation-${position.userId}-${Date.now()}`,
      market: position.market,
      side: closingSide,
      type: "MARKET",
      quantity: position.quantity,
      price: 0n,
      leverage,
      status: "resting",
      createdAt: new Date(),
    };

    const fills = this.matchingEngine.processOrder(closingOrder);
    if (fills.length === 0) {
      return;
    }

    const totalQuantity = position.quantity;
    const totalMargin = position.margin;
    let remainingQuantity = totalQuantity;
    let remainingMargin = totalMargin;

    for (const fill of fills) {
      this.ledger.updatePosition(
        fill.makerUserId,
        fill.market,
        position.side,
        fill.quantity,
        fill.price,
        fill.leverage,
      );

      const pnl = position.side === "LONG"
        ? (fill.price - position.averagePrice) * fill.quantity
        : (position.averagePrice - fill.price) * fill.quantity;

      const marginFreed = fill.quantity === remainingQuantity
        ? remainingMargin
        : (totalMargin * fill.quantity) / totalQuantity;

      remainingQuantity -= fill.quantity;
      remainingMargin -= marginFreed;

      this.ledger.settlePnL(position.userId, pnl, marginFreed);
    }

    if (remainingQuantity === 0n) {
      this.ledger.closePosition(position.userId, position.market);
      return;
    }

    position.quantity = remainingQuantity;
    position.margin = remainingMargin;
    position.liquidationPrice = position.side === "LONG"
      ? position.averagePrice - (position.margin / position.quantity)
      : position.averagePrice + (position.margin / position.quantity);
  }
}
