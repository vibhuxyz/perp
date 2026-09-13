import { ENV } from "@repo/env-config";
import { Exchange, settleFunding, FUNDING_INTERVAL_MS, type Fill } from "engine";
import { startPoller } from "mark-price-poller";
import { MarketFeed } from "@repo/ws";
import { snapshot } from "db-writer";

export const MARKET = "BTC-PERP";

const SNAPSHOT_INTERVAL_MS = 5_000;

/**
 * The engine runs inside the API process and is called directly. That is deliberate for now:
 * Kafka arrives at the BETTER rung, and until then a single process means a single thread,
 * which means order handling is sequential without us doing anything to arrange it.
 */
export const exchange = new Exchange();
export const feed = new MarketFeed(ENV.WS_PORT);
export const fills: Fill[] = [];

let indexPrice = 50_000n;

export function getIndexPrice(): bigint {
  return indexPrice;
}

export function recordFills(newFills: Fill[]): void {
  fills.push(...newFills);

  for (const fill of newFills) {
    feed.broadcast({ type: "fill", fill });
  }
}

function seedInitialLiquidity(): void {
  exchange.deposit("liquidity-provider", 10_000_000n);

  const basePrice = 50_000n;
  const levels = [
    { offset: 50n, qty: 2n },
    { offset: 100n, qty: 5n },
    { offset: 150n, qty: 8n },
    { offset: 200n, qty: 12n },
    { offset: 250n, qty: 15n },
    { offset: 300n, qty: 20n },
  ];

  for (const lvl of levels) {
    exchange.placeOrder({
      userId: "liquidity-provider",
      orderId: `seed-bid-${lvl.offset}`,
      market: MARKET,
      side: "LONG",
      type: "LIMIT",
      price: basePrice - lvl.offset,
      quantity: lvl.qty,
      leverage: 1n,
      status: "resting",
      createdAt: new Date(),
    });

    exchange.placeOrder({
      userId: "liquidity-provider",
      orderId: `seed-ask-${lvl.offset}`,
      market: MARKET,
      side: "SHORT",
      type: "LIMIT",
      price: basePrice + lvl.offset,
      quantity: lvl.qty,
      leverage: 1n,
      status: "resting",
      createdAt: new Date(),
    });
  }
}

export function start(): void {
  exchange.createMarket(MARKET);
  seedInitialLiquidity();

  startPoller({ startPrice: indexPrice }, price => {
    indexPrice = price;
    feed.broadcast({ type: "index", market: MARKET, price });

    for (const position of exchange.riskManager.checkLiquidations(MARKET, price)) {
      feed.broadcast({ type: "liquidation", position });
    }
  });

  setInterval(() => {
    const book = exchange.matchingEngine.orderbooks.get(MARKET)!;
    const payments = settleFunding(exchange.ledger, MARKET, book.lastTradePrice ?? indexPrice, indexPrice);

    if (payments.length > 0) {
      feed.broadcast({ type: "funding", payments });
    }
  }, FUNDING_INTERVAL_MS);

  setInterval(() => {
    snapshot(exchange.ledger, fills, ENV.SNAPSHOT_PATH).catch(err =>
      console.error("snapshot failed:", err),
    );
  }, SNAPSHOT_INTERVAL_MS);
}
