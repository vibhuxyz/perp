import type { Order, Position, Market } from "../types/index";
import type { Ledger } from "../core/Ledger";
import type { MatchingEngine } from "../core/MatchingEngine";
import { calculatePnL } from "./calculatePnL";
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

    // Collect first: liquidating mid-iteration rebuilds the position lists we are walking.
    for (const positions of this.ledger.userPositions.values()) {
      for (const position of positions) {
        if (position.market === market && isLiquidatable(position, currentIndexPrice)) {
          breaching.push(position);
        }
      }
    }

    for (const position of breaching) {
      this.liquidate(position, currentIndexPrice);
    }

    return breaching;
  }

  private liquidate(position: Position, indexPrice: bigint): void {
    const closingOrder: Order = {
      userId: position.userId,
      orderId: `liquidation-${position.userId}-${Date.now()}`,
      market: position.market,
      side: position.side === "LONG" ? "SHORT" : "LONG",
      type: "MARKET",
      quantity: position.quantity,
      price: 0n,
      leverage: 1n,
      status: "resting",
      createdAt: new Date(),
    };

    this.matchingEngine.processOrder(closingOrder);

    // Settles against the index price rather than what the close actually filled at,
    // and leaves the counterparty position untouched. Both are the GOOD rung.
    const pnl = calculatePnL(position, indexPrice);

    this.ledger.settlePnL(position.userId, pnl, position.margin);
    this.ledger.closePosition(position.userId, position.market);
  }
}
