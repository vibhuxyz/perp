import type { Exchange } from "../core/Exchange";
import type { Order, Side } from "../types/index";

export class NoiseTraderBot {
  private exchange: Exchange;
  private userId: string;
  private market: string;
  private orderCounter: number;

  constructor(exchange: Exchange, userId: string, market = "BTC-PERP") {
    this.exchange = exchange;
    this.userId = userId;
    this.market = market;
    this.orderCounter = 0;
  }

  public step(seed: number): void {
    this.orderCounter += 1;
    const side: Side = seed % 2 === 0 ? "LONG" : "SHORT";
    const qty = BigInt((seed % 3) + 1);

    const order: Order = {
      userId: this.userId,
      orderId: `noise_${this.userId}_${this.orderCounter}`,
      market: this.market,
      side,
      type: "MARKET",
      price: 0n,
      quantity: qty,
      leverage: 5n,
      status: "resting",
      createdAt: new Date(),
    };

    this.exchange.placeOrder(order);
  }
}
