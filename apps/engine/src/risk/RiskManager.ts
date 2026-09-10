import type { Position, Market } from "../types/index";
import type { Ledger } from "../core/Ledger";
import type { MatchingEngine } from "../core/MatchingEngine";

export class RiskManager {
  private ledger: Ledger;
  private matchingEngine: MatchingEngine;

  constructor(ledger: Ledger, matchingEngine: MatchingEngine) {
    this.ledger = ledger;
    this.matchingEngine = matchingEngine;
  }

  // TODO: Iterate over all positions for the given market.
  // If a position is liquidatable based on the currentIndexPrice, 
  // trigger a force-close MARKET order via the matchingEngine.
  // Update the ledger with the result.
  public checkLiquidations(market: Market, currentIndexPrice: bigint): void {
  }
}
