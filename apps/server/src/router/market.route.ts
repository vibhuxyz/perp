import express from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { exchange, getIndexPrice, MARKET } from "../exchange";

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

  res.json({
    market: book.market,
    bids: levels(book.bids),
    asks: levels(book.asks),
    lastTradePrice: book.lastTradePrice?.toString() ?? null,
    indexPrice: getIndexPrice().toString(),
  });
});

router.get("/positions", (req, res, next) => {
  const authHeader = (req.headers.authorization || req.headers.token) as string;
  if (!authHeader) {
    return res.json([]);
  }

  return authMiddleware(req, res, () => {
    //@ts-ignore
    const positions = exchange.ledger.userPositions.get(String(req.userId)) ?? [];

    res.json(
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

router.get("/equity", (req, res, next) => {
  const authHeader = (req.headers.authorization || req.headers.token) as string;
  if (!authHeader) {
    return res.json({
      availableBalance: "0",
      marginLocked: "0",
    });
  }

  return authMiddleware(req, res, () => {
    //@ts-ignore
    const collateral = exchange.ledger.usersCollateral.get(String(req.userId));

    if (!collateral) {
      return res.json({
        availableBalance: "0",
        marginLocked: "0",
      });
    }

    res.json({
      availableBalance: collateral.availableBalance.toString(),
      marginLocked: collateral.marginLocked.toString(),
    });
  });
});

router.get("/markets", (_req, res) => {
  res.json([MARKET]);
});

export default router;
