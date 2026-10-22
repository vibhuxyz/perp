import { ENV } from "@repo/env-config";
import {
  Exchange,
  settleFunding,
  calculateFundingRate,
  FUNDING_INTERVAL_MS,
  type Fill,
} from "engine";
import { startPoller } from "mark-price-poller";
import { MarketFeed } from "@repo/ws";
import { snapshot } from "db-writer";

export const MARKET = "BTC-PERP";

const SNAPSHOT_INTERVAL_MS = 5_000;

export const exchange = new Exchange();
export const feed = new MarketFeed(ENV.WS_PORT);
export const fills: Fill[] = [];

let indexPrice = 50_000n;
let nextFundingTime = new Date(Date.now() + FUNDING_INTERVAL_MS);

export function getIndexPrice(): bigint {
  return indexPrice;
}

export function getNextFundingTime(): Date {
  return nextFundingTime;
}

export function broadcastDepth(market = MARKET): void {
  const book = exchange.matchingEngine.orderbooks.get(market);
  if (!book) {
    return;
  }

  const levels = (side: typeof book.bids) =>
    Array.from(side.values())
      .map(level => ({
        price: level.price.toString(),
        quantity: level.orders.reduce((total, o) => total + o.quantity, 0n).toString(),
      }))
      .filter(level => level.quantity !== "0");

  feed.broadcast({
    type: "depth",
    market: book.market,
    bids: levels(book.bids),
    asks: levels(book.asks),
    lastTradePrice: book.lastTradePrice?.toString() ?? null,
    indexPrice: getIndexPrice().toString(),
  });
}

export function broadcastTicker(market = MARKET): void {
  const book = exchange.matchingEngine.orderbooks.get(market);
  const lastPrice = book?.lastTradePrice ?? indexPrice;
  const fundingRate = calculateFundingRate(lastPrice, indexPrice);

  feed.broadcast({
    type: "ticker",
    market,
    lastPrice: lastPrice.toString(),
    indexPrice: indexPrice.toString(),
    fundingRate: fundingRate.toString(),
    nextFundingTime: nextFundingTime.toISOString(),
  });
}

export function recordFills(newFills: Fill[]): void {
  fills.push(...newFills);

  for (const fill of newFills) {
    feed.broadcast({ type: "fill", fill });
  }

  broadcastDepth(MARKET);
  broadcastTicker(MARKET);
}

export function start(): void {
  exchange.createMarket(MARKET);

  startPoller({ startPrice: indexPrice }, price => {
    indexPrice = price;
    feed.broadcast({ type: "index", market: MARKET, price });
    broadcastTicker(MARKET);

    for (const position of exchange.riskManager.checkLiquidations(MARKET, price)) {
      feed.broadcast({ type: "liquidation", position });
      broadcastDepth(MARKET);
    }
  });

  setInterval(() => {
    const book = exchange.matchingEngine.orderbooks.get(MARKET);
    const lastPrice = book?.lastTradePrice ?? indexPrice;
    const payments = settleFunding(exchange.ledger, MARKET, lastPrice, indexPrice);

    if (payments.length > 0) {
      feed.broadcast({ type: "funding", payments });
    }

    nextFundingTime = new Date(Date.now() + FUNDING_INTERVAL_MS);
    broadcastTicker(MARKET);
  }, FUNDING_INTERVAL_MS);

  setInterval(() => {
    snapshot(exchange.ledger, fills, ENV.SNAPSHOT_PATH).catch(err =>
      console.error("snapshot failed:", err),
    );
  }, SNAPSHOT_INTERVAL_MS);
}
