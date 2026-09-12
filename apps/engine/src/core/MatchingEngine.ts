import { Orderbook } from "./orderbook";
import type { Order, Fill, Market } from "../types/index";

export class MatchingEngine {
  public orderbooks: Map<Market, Orderbook>;

  constructor() {
    this.orderbooks = new Map();
  }

  public createMarket(market: Market): void {
    if (!this.orderbooks.has(market)) {
      this.orderbooks.set(market, new Orderbook(market));
    }
  }

  public processOrder(order: Order): Fill[] {
    const book = this.orderbooks.get(order.market);

    if (!book) {
      throw new Error(`Unknown market: ${order.market}`);
    }

    return book.processOrder(order);
  }
}
