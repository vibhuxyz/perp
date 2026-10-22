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

export const MARKETS = ["BTC-PERP", "ETH-PERP", "SOL-PERP"] as const;
export type SupportedMarket = (typeof MARKETS)[number];
export const MARKET = "BTC-PERP";

const MARKET_CONFIGS: Record<SupportedMarket, { symbol: string; startPrice: bigint; stepSize: bigint }> = {
  "BTC-PERP": { symbol: "BTCUSDT", startPrice: 50_000n, stepSize: 50n },
  "ETH-PERP": { symbol: "ETHUSDT", startPrice: 3_000n, stepSize: 5n },
  "SOL-PERP": { symbol: "SOLUSDT", startPrice: 150n, stepSize: 1n },
};

const SNAPSHOT_INTERVAL_MS = 5_000;

export const exchange = new Exchange();
export const feed = new MarketFeed(ENV.WS_PORT);
export const fills: Fill[] = [];

const indexPrices = new Map<string, bigint>([
  ["BTC-PERP", 50_000n],
  ["ETH-PERP", 3_000n],
  ["SOL-PERP", 150n],
]);

const nextFundingTimes = new Map<string, Date>([
  ["BTC-PERP", new Date(Date.now() + FUNDING_INTERVAL_MS)],
  ["ETH-PERP", new Date(Date.now() + FUNDING_INTERVAL_MS)],
  ["SOL-PERP", new Date(Date.now() + FUNDING_INTERVAL_MS)],
]);

export function getIndexPrice(market: string = MARKET): bigint {
  return indexPrices.get(market) ?? indexPrices.get(MARKET) ?? 50_000n;
}

export function getNextFundingTime(market: string = MARKET): Date {
  return nextFundingTimes.get(market) ?? nextFundingTimes.get(MARKET) ?? new Date(Date.now() + FUNDING_INTERVAL_MS);
}

export async function emitEngineEvent(type: string, payload: object, key = MARKET): Promise<void> {
  try {
    await sendMessage(TOPICS.ENGINE_EVENTS, { type, payload, timestamp: Date.now() }, key);
  } catch (_err) {
    void _err;
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

  const payload = {
    type: "depth",
    channel: `depth:${book.market}`,
    market: book.market,
    bids: levels(book.bids),
    asks: levels(book.asks),
    lastTradePrice: book.lastTradePrice?.toString() ?? null,
    indexPrice: getIndexPrice(market).toString(),
  };

  feed.broadcast(payload);
}

export function broadcastTicker(market = MARKET): void {
  const book = exchange.matchingEngine.orderbooks.get(market);
  const idxPrice = getIndexPrice(market);
  const lastPrice = book?.lastTradePrice ?? idxPrice;
  const fundingRate = calculateFundingRate(lastPrice, idxPrice);
  const nextFunding = getNextFundingTime(market);

  feed.broadcast({
    type: "ticker",
    channel: `market:${market}`,
    market,
    lastPrice: lastPrice.toString(),
    indexPrice: idxPrice.toString(),
    fundingRate: fundingRate.toString(),
    nextFundingTime: nextFunding.toISOString(),
  });
}

export function recordFills(newFills: Fill[]): void {
  fills.push(...newFills);
  const affected = new Set<string>();

  for (const fill of newFills) {
    affected.add(fill.market);
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

  for (const market of affected) {
    broadcastDepth(market);
    broadcastTicker(market);
  }
}

export function start(): void {
  for (const m of MARKETS) {
    exchange.createMarket(m);
    const cfg = MARKET_CONFIGS[m];
    startPoller({ startPrice: cfg.startPrice, stepSize: cfg.stepSize, symbol: cfg.symbol }, price => {
      indexPrices.set(m, price);
      feed.broadcast({ type: "index", channel: `market:${m}`, market: m, price });
      broadcastTicker(m);

      for (const position of exchange.riskManager.checkLiquidations(m, price)) {
        feed.broadcast({ type: "liquidation", channel: `market:${m}`, position });
        void emitEngineEvent("liquidation", position, position.market);
        broadcastDepth(m);
      }
    });
  }

  setInterval(() => {
    const nextTime = new Date(Date.now() + FUNDING_INTERVAL_MS);
    for (const m of MARKETS) {
      nextFundingTimes.set(m, nextTime);
      const book = exchange.matchingEngine.orderbooks.get(m);
      const idxPrice = getIndexPrice(m);
      const lastPrice = book?.lastTradePrice ?? idxPrice;
      const payments = settleFunding(exchange.ledger, m, lastPrice, idxPrice);

      if (payments.length > 0) {
        feed.broadcast({ type: "funding", channel: `market:${m}`, payments });
        void emitEngineEvent("funding", payments, m);
      }
      broadcastTicker(m);
    }
  }, FUNDING_INTERVAL_MS);

  setInterval(() => {
    snapshot(exchange.ledger, fills, ENV.SNAPSHOT_PATH).catch(_err => {
      void _err;
    });
  }, SNAPSHOT_INTERVAL_MS);
}
