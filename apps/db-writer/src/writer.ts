import { db, tradesTable, candlesTable } from "@repo/db";
import { cacheBalance, cachePositions } from "@repo/shared";
import type { Fill, Collateral, Position } from "engine";
import { createConsumer, parseMessage, TOPICS } from "@repo/shared";

export async function recordTrade(fill: Fill): Promise<void> {
  try {
    await db.insert(tradesTable).values({
      id: fill.fillId,
      market: fill.market,
      price: fill.price.toString(),
      quantity: fill.quantity.toString(),
      makerOrderId: fill.makerOrderId,
      makerUserId: fill.makerUserId,
      takerOrderId: fill.takerOrderId,
      takerUserId: fill.takerUserId,
      createdAt: fill.createdAt,
    });
  } catch (_err) {
    void _err;
  }
}

export async function recordCandle(
  market: string,
  price: bigint,
  quantity: bigint,
  time: Date = new Date(),
): Promise<void> {
  try {
    const minuteTime = new Date(Math.floor(time.getTime() / 60_000) * 60_000);
    const priceStr = price.toString();
    const qtyStr = quantity.toString();

    await db.insert(candlesTable).values({
      time: minuteTime,
      market,
      resolution: "1m",
      open: priceStr,
      high: priceStr,
      low: priceStr,
      close: priceStr,
      volume: qtyStr,
    });
  } catch (_err) {
    void _err;
  }
}

export async function cacheUserState(
  userId: string,
  collateral?: Collateral,
  positions?: Position[],
): Promise<void> {
  if (collateral) {
    await cacheBalance(userId, {
      availableBalance: collateral.availableBalance.toString(),
      marginLocked: collateral.marginLocked.toString(),
    });
  }

  if (positions) {
    await cachePositions(
      userId,
      positions.map(p => ({
        market: p.market,
        side: p.side,
        quantity: p.quantity.toString(),
        averagePrice: p.averagePrice.toString(),
        margin: p.margin.toString(),
        liquidationPrice: p.liquidationPrice.toString(),
      })),
    );
  }
}

export async function startDbWriterConsumer(): Promise<() => Promise<void>> {
  const consumer = createConsumer("db-writer-group");

  try {
    await consumer.connect();
    await consumer.subscribe({ topic: TOPICS.ENGINE_EVENTS, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message }) => {
        const event = parseMessage<{ type: string; payload: unknown }>(message);
        if (!event) {
          return;
        }

        if (event.type === "fill" && event.payload) {
          const fill = event.payload as Fill;
          fill.createdAt = new Date(fill.createdAt);
          fill.price = BigInt(fill.price);
          fill.quantity = BigInt(fill.quantity);
          await recordTrade(fill);
          await recordCandle(fill.market, fill.price, fill.quantity, fill.createdAt);
        }
      },
    });
  } catch (_err) {
    void _err;
  }

  return async () => {
    try {
      await consumer.disconnect();
    } catch (_err) {
      void _err;
    }
  };
}
