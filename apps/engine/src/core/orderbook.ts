import type { Fill, Order } from "../types/index";

export class PriceLevel {
  public price: bigint;
  public orders: Order[];

  constructor(price: bigint) {
    this.price = price;
    this.orders = [];
  }
}

function binaryInsert(arr: bigint[], val: bigint, ascending: boolean): void {
  let low = 0;
  let high = arr.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    const midVal = arr[mid] ?? 0n;
    const cmp = ascending ? midVal < val : midVal > val;
    if (cmp) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  arr.splice(low, 0, val);
}

export class Orderbook {
  public market: string;
  public bids: Map<bigint, PriceLevel>;
  public asks: Map<bigint, PriceLevel>;
  public sortedBidPrices: bigint[];
  public sortedAskPrices: bigint[];
  public lastTradePrice: bigint | null;

  constructor(market: string) {
    this.market = market;
    this.bids = new Map();
    this.asks = new Map();
    this.sortedBidPrices = [];
    this.sortedAskPrices = [];
    this.lastTradePrice = null;
  }

  public processOrder(order: Order): Fill[] {
    const fills = order.side === "LONG"
      ? this.matchLongOrder(order)
      : this.matchShortOrder(order);

    if (fills.length > 0) {
      this.lastTradePrice = fills[fills.length - 1]?.price ?? null;
    }

    return fills;
  }

  public restOrder(order: Order): void {
    if (order.type !== "LIMIT" || order.quantity === 0n) return;
    if (order.side === "LONG") {
      this.restIfUnfilled(order, this.bids, this.sortedBidPrices, false);
    } else {
      this.restIfUnfilled(order, this.asks, this.sortedAskPrices, true);
    }
  }

  private removeRestingOrder(
    book: Map<bigint, PriceLevel>,
    sortedPrices: bigint[],
    orderId: string,
  ): Order | undefined {
    for (const [price, level] of book.entries()) {
      const idx = level.orders.findIndex(o => o.orderId === orderId);
      if (idx !== -1) {
        const [cancelled] = level.orders.splice(idx, 1);
        if (level.orders.length === 0) {
          book.delete(price);
          const pIdx = sortedPrices.indexOf(price);
          if (pIdx !== -1) sortedPrices.splice(pIdx, 1);
        }
        return cancelled;
      }
    }
    return undefined;
  }

  public cancelOrder(orderId: string): Order | undefined {
    const cancelledBid = this.removeRestingOrder(this.bids, this.sortedBidPrices, orderId);
    if (cancelledBid) return cancelledBid;
    return this.removeRestingOrder(this.asks, this.sortedAskPrices, orderId);
  }

  private matchLevel(order: Order, priceLevel: PriceLevel, fills: Fill[]): void {
    while (priceLevel.orders.length > 0 && order.quantity > 0n) {
      const counterparty = priceLevel.orders[0];
      if (!counterparty) break;
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
  }

  private matchAgainstBook(
    order: Order,
    opposingBook: Map<bigint, PriceLevel>,
    sortedPrices: bigint[],
    canCross: (bestPrice: bigint) => boolean,
  ): Fill[] {
    const fills: Fill[] = [];

    while (sortedPrices.length > 0 && order.quantity > 0n) {
      const bestPrice = sortedPrices[0];
      if (bestPrice === undefined) break;

      if (order.type === "LIMIT" && !canCross(bestPrice)) {
        break;
      }

      const priceLevel = opposingBook.get(bestPrice);
      if (!priceLevel) {
        sortedPrices.shift();
        continue;
      }

      this.matchLevel(order, priceLevel, fills);

      if (priceLevel.orders.length === 0) {
        opposingBook.delete(bestPrice);
        sortedPrices.shift();
      }
    }

    return fills;
  }

  private restIfUnfilled(
    order: Order,
    restingBook: Map<bigint, PriceLevel>,
    sortedPrices: bigint[],
    ascending: boolean,
  ): void {
    if (order.type !== "LIMIT" || order.quantity === 0n) return;

    let level = restingBook.get(order.price);
    if (!level) {
      level = new PriceLevel(order.price);
      restingBook.set(order.price, level);
      binaryInsert(sortedPrices, order.price, ascending);
    }
    level.orders.push(order);
  }

  private matchLongOrder(order: Order): Fill[] {
    const fills = this.matchAgainstBook(order, this.asks, this.sortedAskPrices, p => p <= order.price);
    this.restIfUnfilled(order, this.bids, this.sortedBidPrices, false);
    return fills;
  }

  private matchShortOrder(order: Order): Fill[] {
    const fills = this.matchAgainstBook(order, this.bids, this.sortedBidPrices, p => p >= order.price);
    this.restIfUnfilled(order, this.asks, this.sortedAskPrices, true);
    return fills;
  }
}
