import express from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { calculatePnL, calculateFundingRate } from "engine";
import {
  exchange,
  getIndexPrice,
  getNextFundingTime,
  MARKET,
  feed,
} from "../exchange";
import { getCachedPositions, getCachedBalance } from "@repo/shared";
import { db, candlesTable } from "@repo/db";
import { desc, eq } from "drizzle-orm";

const router = express.Router();

router.get("/depth/:market", (req, res) => {
  const book = exchange.matchingEngine.orderbooks.get(req.params.market);

  if (!book) {
    return res.status(404).json({ error: "Unknown market" });
  }

  const levels = (side: typeof book.bids) =>
    Array.from(side.values())
      .map(level => ({
        price: level.price.toString(),
        quantity: level.orders.reduce((total, o) => total + o.quantity, 0n).toString(),
      }))
      .filter(level => level.quantity !== "0");

  return res.json({
    market: book.market,
    bids: levels(book.bids),
    asks: levels(book.asks),
    lastTradePrice: book.lastTradePrice?.toString() ?? null,
    indexPrice: getIndexPrice().toString(),
  });
});

router.get("/ticker", (_req, res) => {
  const book = exchange.matchingEngine.orderbooks.get(MARKET);
  const lastPrice = book?.lastTradePrice ?? getIndexPrice();
  const indexPrice = getIndexPrice();
  const fundingRate = calculateFundingRate(lastPrice, indexPrice);

  return res.json({
    market: MARKET,
    lastPrice: lastPrice.toString(),
    indexPrice: indexPrice.toString(),
    fundingRate: fundingRate.toString(),
    nextFundingTime: getNextFundingTime().toISOString(),
  });
});

router.get("/candles", async (req, res) => {
  const market = (req.query.market as string) ?? MARKET;

  try {
    const rows = await db
      .select()
      .from(candlesTable)
      .where(eq(candlesTable.market, market))
      .orderBy(desc(candlesTable.time))
      .limit(100);

    if (rows.length > 0) {
      const formatted = rows.reverse().map(r => ({
        time: Math.floor(new Date(r.time).getTime() / 1000),
        open: Number(r.open),
        high: Number(r.high),
        low: Number(r.low),
        close: Number(r.close),
        volume: Number(r.volume),
      }));
      return res.json(formatted);
    }
  } catch {
    // db fallback
  }

  const now = Date.now();
  const currentPrice = Number(exchange.matchingEngine.orderbooks.get(market)?.lastTradePrice ?? getIndexPrice());
  const candleCount = Math.min(Number(req.query.limit) || 100, 300);
  const candleDurationMs = 60_000;
  const result = [];

  let lastClose = currentPrice;
  for (let i = candleCount - 1; i >= 0; i--) {
    const time = Math.floor((now - i * candleDurationMs) / 1000);
    const variance = (Math.random() - 0.5) * 40;
    const open = Math.round(lastClose);
    const close = Math.max(1, Math.round(open + variance));
    const high = Math.max(open, close) + Math.round(Math.random() * 20);
    const low = Math.min(open, close) - Math.round(Math.random() * 20);
    const volume = Math.round(Math.random() * 50 + 5);

    result.push({ time, open, high, low, close, volume });
    lastClose = close;
  }

  return res.json(result);
});

router.get("/positions", (req, res) => {
  const authHeader = (req.headers.authorization || req.headers.token) as string;
  if (!authHeader) {
    return res.json([]);
  }

  return authMiddleware(req, res, async () => {
    const userId = String(req.userId);
    const cached = await getCachedPositions<unknown[]>(userId);
    if (cached) {
      return res.json(cached);
    }

    const positions = exchange.ledger.userPositions.get(userId) ?? [];
    return res.json(
      positions.map((p) => ({
        market: p.market,
        side: p.side,
        quantity: p.quantity.toString(),
        averagePrice: p.averagePrice.toString(),
        margin: p.margin.toString(),
        liquidationPrice: p.liquidationPrice.toString(),
      })),
    );
  });
});

router.post("/positions/close", (req, res) => {
  const authHeader = (req.headers.authorization || req.headers.token) as string;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return authMiddleware(req, res, () => {
    const userId = String(req.userId);
    const { market } = req.body;
    if (!market) {
      return res.status(400).json({ error: "Market is required" });
    }

    const position = exchange.ledger.getPosition(userId, market);
    if (!position) {
      return res.status(404).json({ error: "Position not found" });
    }

    const indexPrice = getIndexPrice();
    const pnl = calculatePnL(position, indexPrice);

    exchange.ledger.settlePnL(userId, pnl, position.margin);
    exchange.ledger.closePosition(userId, market);

    feed.broadcast({
      type: "liquidation",
      position,
    });

    return res.json({ success: true });
  });
});

router.get("/equity", (req, res) => {
  const authHeader = (req.headers.authorization || req.headers.token) as string;
  if (!authHeader) {
    return res.json({
      availableBalance: "0",
      marginLocked: "0",
    });
  }

  return authMiddleware(req, res, async () => {
    const userId = String(req.userId);
    const cached = await getCachedBalance<{ availableBalance: string; marginLocked: string }>(userId);
    if (cached) {
      return res.json(cached);
    }

    let collateral = exchange.ledger.usersCollateral.get(userId);
    if (!collateral) {
      collateral = exchange.deposit(userId, 10_000n);
    }

    return res.json({
      availableBalance: collateral.availableBalance.toString(),
      marginLocked: collateral.marginLocked.toString(),
    });
  });
});

router.get("/markets", (_req, res) => {
  res.json([MARKET, "ETH-PERP"]);
});

export default router;
