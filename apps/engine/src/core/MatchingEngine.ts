import { Orderbook } from "./orderbook";
import type { Order, Fill, Market } from "../types/index";

export class MatchingEngine {
  public orderbooks: Map<Market, Orderbook>;

  constructor() {
    this.orderbooks = new Map();
  }

  // TODO: Route the incoming order to the correct orderbook.
  // Return the resulting fills.
  // DO NOT handle margin or collateral here.
  public processOrder(order: Order): Fill[] {
    return [];
  }

  // TODO: Add a new market (e.g., "BTC-PERP")
  public createMarket(market: Market): void {
  }
}
