import crypto from "node:crypto";
import type { Collateral, Position, Order, Market, Side, OrderStatus } from "../types/index";
import type { Exchange } from "../core/Exchange";

export interface SerializedCollateral {
  userId: string;
  availableBalance: string;
  marginLocked: string;
}

export interface SerializedPosition {
  userId: string;
  market: Market;
  side: Side;
  quantity: string;
  averagePrice: string;
  margin: string;
  totalNotional?: string;
  liquidationPrice: string;
  bankruptcyPrice?: string;
}

export interface SerializedOrder {
  orderId: string;
  userId: string;
  market: Market;
  side: Side;
  type: "LIMIT" | "MARKET";
  price: string;
  quantity: string;
  leverage: string;
  status: OrderStatus;
  createdAt: string;
}

export interface EngineSnapshot {
  snapshotId: string;
  lastSequence: string;
  timestamp: number;
  usersCollateral: [string, SerializedCollateral][];
  userPositions: [string, SerializedPosition[]][];
  insuranceFund: string;
  feePool: string;
  restingOrders: [string, SerializedOrder[]][];
  appliedKeys: string[];
}

export function createSnapshot(exchange: Exchange, lastSequence: bigint): EngineSnapshot {
  const usersCollateral: [string, SerializedCollateral][] = [];
  for (const [userId, col] of exchange.ledger.usersCollateral.entries()) {
    usersCollateral.push([
      userId,
      {
        userId: col.userId,
        availableBalance: col.availableBalance.toString(),
        marginLocked: col.marginLocked.toString(),
      },
    ]);
  }

  const userPositions: [string, SerializedPosition[]][] = [];
  for (const [userId, positions] of exchange.ledger.userPositions.entries()) {
    userPositions.push([
      userId,
      positions.map(p => ({
        userId: p.userId,
        market: p.market,
        side: p.side,
        quantity: p.quantity.toString(),
        averagePrice: p.averagePrice.toString(),
        margin: p.margin.toString(),
        totalNotional: p.totalNotional?.toString(),
        liquidationPrice: p.liquidationPrice.toString(),
        bankruptcyPrice: p.bankruptcyPrice?.toString(),
      })),
    ]);
  }

  const restingOrders: [string, SerializedOrder[]][] = [];
  for (const [userId, orderMap] of exchange.restingOrders.entries()) {
    const list: SerializedOrder[] = [];
    for (const order of orderMap.values()) {
      list.push({
        orderId: order.orderId,
        userId: order.userId,
        market: order.market,
        side: order.side,
        type: order.type,
        price: order.price.toString(),
        quantity: order.quantity.toString(),
        leverage: order.leverage.toString(),
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      });
    }
    restingOrders.push([userId, list]);
  }

  return {
    snapshotId: crypto.randomUUID(),
    lastSequence: lastSequence.toString(),
    timestamp: Date.now(),
    usersCollateral,
    userPositions,
    insuranceFund: exchange.ledger.insuranceFund.toString(),
    feePool: exchange.ledger.feePool.toString(),
    restingOrders,
    appliedKeys: Array.from(exchange.appliedKeys),
  };
}

export function restoreSnapshot(snapshot: EngineSnapshot, exchange: Exchange): void {
  exchange.ledger.usersCollateral.clear();
  for (const [userId, col] of snapshot.usersCollateral) {
    const collateral: Collateral = {
      userId: col.userId,
      availableBalance: BigInt(col.availableBalance),
      marginLocked: BigInt(col.marginLocked),
    };
    exchange.ledger.usersCollateral.set(userId, collateral);
  }

  exchange.ledger.userPositions.clear();
  for (const [userId, posList] of snapshot.userPositions) {
    const positions: Position[] = posList.map(p => ({
      userId: p.userId,
      market: p.market,
      side: p.side,
      quantity: BigInt(p.quantity),
      averagePrice: BigInt(p.averagePrice),
      margin: BigInt(p.margin),
      totalNotional: p.totalNotional ? BigInt(p.totalNotional) : undefined,
      liquidationPrice: BigInt(p.liquidationPrice),
      bankruptcyPrice: p.bankruptcyPrice ? BigInt(p.bankruptcyPrice) : undefined,
    }));
    exchange.ledger.userPositions.set(userId, positions);
  }

  exchange.ledger.insuranceFund = BigInt(snapshot.insuranceFund);
  exchange.ledger.feePool = BigInt(snapshot.feePool);
  exchange.appliedKeys = new Set(snapshot.appliedKeys);

  exchange.restingOrders.clear();
  for (const [userId, orders] of snapshot.restingOrders) {
    const userOrderMap = new Map<string, Order>();
    for (const ord of orders) {
      const order: Order = {
        orderId: ord.orderId,
        userId: ord.userId,
        market: ord.market,
        side: ord.side,
        type: ord.type,
        price: BigInt(ord.price),
        quantity: BigInt(ord.quantity),
        leverage: BigInt(ord.leverage),
        status: ord.status,
        createdAt: new Date(ord.createdAt),
      };
      userOrderMap.set(ord.orderId, order);
      exchange.createMarket(ord.market);
      exchange.matchingEngine.orderbooks.get(ord.market)?.restOrder(order);
    }
    exchange.restingOrders.set(userId, userOrderMap);
  }
}

export function computeStateHash(exchange: Exchange): string {
  const sortedCollateral = Array.from(exchange.ledger.usersCollateral.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([userId, col]) => ({
      userId,
      available: col.availableBalance.toString(),
      locked: col.marginLocked.toString(),
    }));

  const sortedPositions = Array.from(exchange.ledger.userPositions.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([userId, positions]) => ({
      userId,
      positions: positions
        .slice()
        .sort((p1, p2) => p1.market.localeCompare(p2.market))
        .map(p => ({
          market: p.market,
          side: p.side,
          quantity: p.quantity.toString(),
          averagePrice: p.averagePrice.toString(),
          margin: p.margin.toString(),
        })),
    }));

  const sortedOrders: { userId: string; orderId: string; price: string; quantity: string }[] = [];
  for (const [userId, orderMap] of exchange.restingOrders.entries()) {
    for (const order of orderMap.values()) {
      sortedOrders.push({
        userId,
        orderId: order.orderId,
        price: order.price.toString(),
        quantity: order.quantity.toString(),
      });
    }
  }
  sortedOrders.sort((a, b) => a.orderId.localeCompare(b.orderId));

  const sortedKeys = Array.from(exchange.appliedKeys).sort();

  const canonical = {
    collateral: sortedCollateral,
    positions: sortedPositions,
    insuranceFund: exchange.ledger.insuranceFund.toString(),
    feePool: exchange.ledger.feePool.toString(),
    restingOrders: sortedOrders,
    appliedKeys: sortedKeys,
  };

  return crypto.createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}
