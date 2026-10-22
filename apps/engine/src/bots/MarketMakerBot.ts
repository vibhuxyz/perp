import type { Exchange } from "../core/Exchange";
import type { Order } from "../types/index";
import type { BotConfig } from "./types";

export class MarketMakerBot {
  private exchange: Exchange;
  private config: BotConfig;
  private activeOrders: string[];

  constructor(exchange: Exchange, config: BotConfig) {
    this.exchange = exchange;
    this.config = config;
    this.activeOrders = [];
  }

  public cancelActiveOrders(): void {
    for (const orderId of this.activeOrders) {
      this.exchange.cancelOrder(this.config.market, this.config.userId, orderId);
    }
    this.activeOrders = [];
  }

  public quote(markPrice: bigint): void {
    this.cancelActiveOrders();

    const spreadPerLevel = (markPrice * this.config.spreadBps) / 10_000n;

    for (let i = 1; i <= this.config.levels; i++) {
      const step = spreadPerLevel * BigInt(i);
      const bidPrice = markPrice - step;
      const askPrice = markPrice + step;

      const bidId = `mm_bid_${Date.now()}_${i}`;
      const bidOrder: Order = {
        userId: this.config.userId,
        orderId: bidId,
        market: this.config.market,
        side: "LONG",
        type: "LIMIT",
        price: bidPrice,
        quantity: this.config.orderSize,
        leverage: 10n,
        status: "resting",
        createdAt: new Date(),
      };
      this.exchange.placeOrder(bidOrder);
      this.activeOrders.push(bidId);

      const askId = `mm_ask_${Date.now()}_${i}`;
      const askOrder: Order = {
        userId: this.config.userId,
        orderId: askId,
        market: this.config.market,
        side: "SHORT",
        type: "LIMIT",
        price: askPrice,
        quantity: this.config.orderSize,
        leverage: 10n,
        status: "resting",
        createdAt: new Date(),
      };
      this.exchange.placeOrder(askOrder);
      this.activeOrders.push(askId);
    }
  }
}
