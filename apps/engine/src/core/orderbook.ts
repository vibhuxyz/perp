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
    const fills = order.side === "LONG"
      ? this.matchLongOrder(order)
      : this.matchShortOrder(order);

    if (fills.length > 0) {
      this.lastTradePrice = fills[fills.length - 1]!.price;
    }

    return fills;
  }

  // Shared by matchLongOrder/matchShortOrder: walk the opposing book (best price first,
  // per sortPrices), filling `order` against resting orders until it's exhausted, a LIMIT
  // order's price is no longer crossable (per crossesLimit), or the book runs out.
  private matchAgainstBook(
    order: Order,
    opposingBook: Map<bigint, PriceLevel>,
    sortPrices: (prices: bigint[]) => bigint[],
    crossesLimit: (price: bigint) => boolean,
  ): Fill[] {
    const fills: Fill[] = [];
    const availablePrices = sortPrices(Array.from(opposingBook.keys()));

    for (const price of availablePrices) {
      if (order.type === "LIMIT" && crossesLimit(price)) {
        break;
      }

      const priceLevel = opposingBook.get(price)!;

      while (priceLevel.orders.length > 0 && order.quantity > 0n) {
        const counterparty = priceLevel.orders[0]!;
        const tradeSize = order.quantity <= counterparty.quantity ? order.quantity : counterparty.quantity;

        fills.push({
          fillId: Math.random().toString(),
          market: this.market,
          price: counterparty.price,
          quantity: tradeSize,
          makerOrderId: counterparty.orderId,
          makerUserId: counterparty.userId,
          takerOrderId: order.orderId,
          takerUserId: order.userId,
          leverage: order.leverage,
          fee: 0,
          createdAt: new Date(),
        });

        order.quantity -= tradeSize;
        counterparty.quantity -= tradeSize;

        if (counterparty.quantity === 0n) {
          priceLevel.orders.shift();
        }
      }

      if (priceLevel.orders.length === 0) {
        opposingBook.delete(price);
      }
    }

    return fills;
  }

  // Rests an unfilled LIMIT order on its own side of the book.
  private restIfUnfilled(order: Order, restingBook: Map<bigint, PriceLevel>): void {
    if (order.type === "LIMIT" && order.quantity > 0n) {
      let level = restingBook.get(order.price);
      if (!level) {
        level = new PriceLevel(order.price);
        restingBook.set(order.price, level);
      }
      level.orders.push(order);
    }
  }

  private matchLongOrder(order: Order): Fill[] {
    const fills = this.matchAgainstBook(
      order,
      this.asks,
      prices => prices.sort((a, b) => Number(a - b)),
      price => price > order.price,
    );
    this.restIfUnfilled(order, this.bids);
    return fills;
  }

  private matchShortOrder(order: Order): Fill[] {
    const fills = this.matchAgainstBook(
      order,
      this.bids,
      prices => prices.sort((a, b) => Number(b - a)),
      price => price < order.price,
    );
    this.restIfUnfilled(order, this.asks);
    return fills;
  }
}
