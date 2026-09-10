import type { Order, Fill } from "../types/index";
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

  // TODO: The main entry point for placing an order.
  // 1. Ask Ledger to lock margin.
  // 2. Pass order to MatchingEngine.
  // 3. For each Fill, ask Ledger to update positions for both Maker and Taker.
  public placeOrder(order: Order): Fill[] {
    return [];
  }
}
