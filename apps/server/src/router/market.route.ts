import express from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { calculatePnL, calculateFundingRate } from "engine";
import {
  exchange,
  getIndexPrice,
  getNextFundingTime,
  MARKET,
  MARKETS,
  feed,
  fills,
} from "../exchange";
import { getCachedPositions, getCachedBalance } from "@repo/shared";
import { db, candlesTable } from "@repo/db";
import { desc, eq } from "drizzle-orm";
import { generateFallbackCandles } from "./candle.helper";

const router = express.Router();

router.get("/depth/:market", (req, res) => {
  const book = exchange.matchingEngine.orderbooks.get(req.params.market);
  if (!book) return res.status(404).json({ error: "Unknown market" });

  const formatSide = (side: typeof book.bids) =>
    Array.from(side.values())
      .map(l => ({ price: l.price.toString(), quantity: l.orders.reduce((t, o) => t + o.quantity, 0n).toString() }))
      .filter(l => l.quantity !== "0");

  return res.json({
    market: book.market,
    bids: formatSide(book.bids),
    asks: formatSide(book.asks),
    lastTradePrice: book.lastTradePrice?.toString() ?? null,
    indexPrice: getIndexPrice(book.market).toString(),
  });
});

router.get("/ticker", (req, res) => {
  const market = (req.query.market as string) ?? MARKET;
  const book = exchange.matchingEngine.orderbooks.get(market);
  const indexPrice = getIndexPrice(market);
  const lastPrice = book?.lastTradePrice ?? indexPrice;
  const fundingRate = calculateFundingRate(lastPrice, indexPrice);

  return res.json({
    market,
    lastPrice: lastPrice.toString(),
    indexPrice: indexPrice.toString(),
    fundingRate: fundingRate.toString(),
    nextFundingTime: getNextFundingTime(market).toISOString(),
  });
});

router.get("/trades", (req, res) => {
  const market = (req.query.market as string) ?? MARKET;
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 50), 100);
  const cursor = req.query.cursor ? Number(req.query.cursor) : fills.length;
  const marketFills = fills.filter(f => f.market === market);
  const startIndex = Math.max(0, cursor - limit);
  const pageFills = marketFills.slice(startIndex, cursor).reverse();

  return res.json({
    trades: pageFills.map(f => ({
      fillId: f.fillId,
      market: f.market,
      price: f.price.toString(),
      quantity: f.quantity.toString(),
      side: f.takerOrderId ? "BUY" : "SELL",
      createdAt: f.createdAt.toISOString(),
    })),
    nextCursor: startIndex > 0 ? startIndex.toString() : null,
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
      return res.json(rows.reverse().map(r => ({
        time: Math.floor(new Date(r.time).getTime() / 1000),
        open: Number(r.open),
        high: Number(r.high),
        low: Number(r.low),
        close: Number(r.close),
        volume: Number(r.volume),
      })));
    }
  } catch (_err) {
    void _err;
  }

  const currentPrice = Number(exchange.matchingEngine.orderbooks.get(market)?.lastTradePrice ?? getIndexPrice(market));
  return res.json(generateFallbackCandles(currentPrice, Number(req.query.limit)));
});

router.get("/positions", (req, res) => {
  const authHeader = (req.headers.authorization || req.headers.token) as string;
  if (!authHeader) return res.json([]);

  return authMiddleware(req, res, async () => {
    const userId = String(req.userId);
    const cached = await getCachedPositions<unknown[]>(userId);
    if (cached) return res.json(cached);

    const positions = exchange.ledger.userPositions.get(userId) ?? [];
    return res.json(positions.map(p => ({
      market: p.market,
      side: p.side,
      quantity: p.quantity.toString(),
      averagePrice: p.averagePrice.toString(),
      margin: p.margin.toString(),
      liquidationPrice: p.liquidationPrice.toString(),
    })));
  });
});

router.post("/positions/close", (req, res) => {
  const authHeader = (req.headers.authorization || req.headers.token) as string;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

  return authMiddleware(req, res, () => {
    const userId = String(req.userId);
    const { market } = req.body;
    if (!market) return res.status(400).json({ error: "Market is required" });

    const position = exchange.ledger.getPosition(userId, market);
    if (!position) return res.status(404).json({ error: "Position not found" });

    const indexPrice = getIndexPrice(market);
    const pnl = calculatePnL(position, indexPrice);
    exchange.ledger.settlePnL(userId, pnl, position.margin);
    exchange.ledger.closePosition(userId, market);
    feed.broadcast({ type: "liquidation", position });
    return res.json({ success: true });
  });
});

router.get("/equity", (req, res) => {
  const authHeader = (req.headers.authorization || req.headers.token) as string;
  if (!authHeader) return res.json({ availableBalance: "0", marginLocked: "0" });

  return authMiddleware(req, res, async () => {
    const userId = String(req.userId);
    const cached = await getCachedBalance<{ availableBalance: string; marginLocked: string }>(userId);
    if (cached) return res.json(cached);

    let collateral = exchange.ledger.usersCollateral.get(userId);
    if (!collateral) collateral = exchange.deposit(userId, 10_000n);

    return res.json({
      availableBalance: collateral.availableBalance.toString(),
      marginLocked: collateral.marginLocked.toString(),
    });
  });
});

router.get("/markets", (_req, res) => {
  const list = MARKETS.map(market => {
    const book = exchange.matchingEngine.orderbooks.get(market);
    const idxPrice = getIndexPrice(market);
    const lastPrice = book?.lastTradePrice ?? idxPrice;
    const fundingRate = calculateFundingRate(lastPrice, idxPrice);
    return {
      market,
      lastPrice: lastPrice.toString(),
      indexPrice: idxPrice.toString(),
      fundingRate: fundingRate.toString(),
      nextFundingTime: getNextFundingTime(market).toISOString(),
    };
  });
  return res.json(list);
});

export default router;
