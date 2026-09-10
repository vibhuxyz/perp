import type { Fill, Order } from "../types/index";

export class PriceLevel {
  public price: bigint;
  public orders: Order[];

  constructor(price: bigint) {
    this.price = price;
    this.orders = []
  }
}

export class Orderbook {
  public market: string;
  public bids: Map<bigint, PriceLevel>;
  public asks: Map<bigint, PriceLevel>;
  public lastTradePrice: bigint | null;

  constructor(market: string) {
    this.market = market;
    this.bids = new Map();
    this.asks = new Map();
    this.lastTradePrice = null
  }

  public processOrder(order: Order): Fill[] {
    if (order.side === "LONG") {
      return this.matchLongOrder(order)
    } else {
      return this.matchShortOrder(order)
    }
  }

  private matchLongOrder(order: Order) {
    const fills: Fill[] = [];
    const availablePrices = Array.from(this.asks.keys()).sort((a, b) => Number(a - b));

    for (const price of availablePrices) {
      if (order.type === "LIMIT" && price > order.price) {
        break;
      }

      const priceLevel = this.asks.get(price)!;

      while (priceLevel.orders.length > 0 && order.quantity > 0n) {
        const seller = priceLevel.orders[0]!;

        let tradeSize;
        if (order.quantity <= seller.quantity) {
          tradeSize = order.quantity;
        } else {
          tradeSize = seller.quantity
        }

        fills.push({
          fillId: Math.random().toString(),
          market: this.market,
          price: seller.price,
          quantity: tradeSize,
          makerOrderId: seller.orderId,
          makerUserId: seller.userId,
          takerOrderId: order.orderId,
          takerUserId: order.userId,
          leverage: order.leverage,
          fee: 0,
          createdAt: new Date()
        })

        order.quantity -= tradeSize
        seller.quantity -= tradeSize

        if (seller.quantity === 0n) {
          priceLevel.orders.shift()
        }
      }

      if (priceLevel.orders.length === 0) {
        this.asks.delete(price)
      }
    }

    const price = this.bids.has(order.price);

    if (order.type === "LIMIT" && order.quantity > 0n) {
      if (!price) {
        const newPrice = new PriceLevel(order.price)
        this.bids.set(order.price, newPrice)
      }
      this.bids.get(order.price)!.orders.push(order)
    }

    return fills;
  }

  private matchShortOrder(order: Order) {
    const fills: Fill[] = [];
    const availablePrices = Array.from(this.bids.keys()).sort((a, b) => Number(b - a));

    for (const price of availablePrices) {
      if (order.type === "LIMIT" && price < order.price) {
        break;
      }

      const priceLevel = this.bids.get(price)!;

      while (priceLevel.orders.length > 0 && order.quantity > 0n) {
        const buyer = priceLevel.orders[0]!;

        let tradeSize;
        if (order.quantity <= buyer.quantity) {
          tradeSize = order.quantity;
        } else {
          tradeSize = buyer.quantity
        }

        fills.push({
          fillId: Math.random().toString(),
          market: this.market,
          price: buyer.price,
          quantity: tradeSize,
          makerOrderId: buyer.orderId,
          makerUserId: buyer.userId,
          takerOrderId: order.orderId,
          takerUserId: order.userId,
          leverage: order.leverage,
          fee: 0,
          createdAt: new Date()
        })

        order.quantity -= tradeSize
        buyer.quantity -= tradeSize

        if (buyer.quantity === 0n) {
          priceLevel.orders.shift()
        }
      }

      if (priceLevel.orders.length === 0) {
        this.bids.delete(price)
      }
    }

    const price = this.asks.has(order.price);

    if (order.type === "LIMIT" && order.quantity > 0n) {
      if (!price) {
        const newPrice = new PriceLevel(order.price)
        this.asks.set(order.price, newPrice)
      }
      this.asks.get(order.price)!.orders.push(order)
    }

    return fills;
  }
}
