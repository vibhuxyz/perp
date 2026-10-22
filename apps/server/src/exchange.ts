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
import { snapshot, recordTrade, recordCandle, cacheUserState } from "db-writer";
import { sendMessage, TOPICS } from "@repo/shared";

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

export async function emitEngineEvent(type: string, payload: object, key = MARKET): Promise<void> {
  try {
    await sendMessage(TOPICS.ENGINE_EVENTS, { type, payload, timestamp: Date.now() }, key);
  } catch {
    // kafka offline
  }
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
    channel: `depth:${book.market}`,
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
    channel: `market:${market}`,
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
    feed.broadcast({ type: "fill", channel: `market:${fill.market}`, fill });
    void emitEngineEvent("fill", fill, fill.market);
    void recordTrade(fill);
    void recordCandle(fill.market, fill.price, fill.quantity, fill.createdAt);

    void cacheUserState(
      fill.takerUserId,
      exchange.ledger.usersCollateral.get(fill.takerUserId),
      exchange.ledger.userPositions.get(fill.takerUserId),
    );
    void cacheUserState(
      fill.makerUserId,
      exchange.ledger.usersCollateral.get(fill.makerUserId),
      exchange.ledger.userPositions.get(fill.makerUserId),
    );
  }

  broadcastDepth(MARKET);
  broadcastTicker(MARKET);
}

export function start(): void {
  exchange.createMarket(MARKET);

  startPoller({ startPrice: indexPrice }, price => {
    indexPrice = price;
    feed.broadcast({ type: "index", channel: `market:${MARKET}`, market: MARKET, price });
    broadcastTicker(MARKET);

    for (const position of exchange.riskManager.checkLiquidations(MARKET, price)) {
      feed.broadcast({ type: "liquidation", channel: `market:${MARKET}`, position });
      void emitEngineEvent("liquidation", position, position.market);
      broadcastDepth(MARKET);
    }
  });

  setInterval(() => {
    const book = exchange.matchingEngine.orderbooks.get(MARKET);
    const lastPrice = book?.lastTradePrice ?? indexPrice;
    const payments = settleFunding(exchange.ledger, MARKET, lastPrice, indexPrice);

    if (payments.length > 0) {
      feed.broadcast({ type: "funding", channel: `market:${MARKET}`, payments });
      void emitEngineEvent("funding", payments, MARKET);
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
