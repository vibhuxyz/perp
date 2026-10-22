import type { Order, Position, Market, Side } from "../types/index";
import type { Ledger } from "../core/Ledger";
import type { MatchingEngine } from "../core/MatchingEngine";
import type { AuditLog } from "../audit/AuditLog";
import { isLiquidatable } from "./risk";
import { executeADL } from "./adl";

export class RiskManager {
  private ledger: Ledger;
  private matchingEngine: MatchingEngine;
  private auditLog?: AuditLog;

  constructor(ledger: Ledger, matchingEngine: MatchingEngine, auditLog?: AuditLog) {
    this.ledger = ledger;
    this.matchingEngine = matchingEngine;
    this.auditLog = auditLog;
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
      this.liquidatePosition(position, currentIndexPrice);
    }

    return breaching;
  }

  private handleDeficit(
    userId: string,
    market: Market,
    liquidatedSide: Side,
    fillQuantity: bigint,
    fillPrice: bigint,
    indexPrice?: bigint,
  ): void {
    const user = this.ledger.usersCollateral.get(userId);
    if (!user || user.availableBalance >= 0n) return;

    const deficit = -user.availableBalance;
    user.availableBalance = 0n;
    const { uncovered } = this.ledger.absorbDeficit(deficit);

    if (uncovered > 0n && indexPrice !== undefined) {
      const opposingSide: Side = liquidatedSide === "LONG" ? "SHORT" : "LONG";
      executeADL(this.ledger, market, opposingSide, fillQuantity, fillPrice, indexPrice);
    }
  }

  public liquidatePosition(position: Position, indexPrice?: bigint): void {
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

      this.handleDeficit(position.userId, position.market, position.side, fill.quantity, fill.price, indexPrice);
    }

    this.auditLog?.record("POSITION_LIQUIDATED", position.userId, {
      market: position.market,
      side: position.side,
      totalQuantity: totalQuantity.toString(),
      remainingQuantity: remainingQuantity.toString(),
      fillsCount: fills.length,
    }, position.market);

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
